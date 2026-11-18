import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { db } from "../server/db/client";

const execFileAsync = promisify(execFile);

type AdminResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type ShopifyVariant = {
  id: string;
  price: string;
  inventoryItem: {
    id: string;
    tracked: boolean;
    inventoryLevels: {
      nodes: Array<{
        location: { id: string };
        quantities: Array<{ name: string; quantity: number }>;
      }>;
    };
  };
};

type ShopifyProduct = {
  id: string;
  title: string;
  variants: { nodes: ShopifyVariant[] };
};

async function adminRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  try {
    const { stdout } = await execFileAsync(
      "node",
      [
        "shopify-admin-api.mjs",
        JSON.stringify({ query, variables }),
      ],
      { maxBuffer: 4 * 1024 * 1024 },
    );
    const parsed = JSON.parse(stdout) as AdminResponse<T>;
    if (parsed.errors?.length) {
      throw new Error(parsed.errors.map((error) => error.message).join("; "));
    }
    if (!parsed.data) {
      throw new Error("Shopify Admin API returned no data");
    }
    return parsed.data;
  } catch (error) {
    const stdout = error && typeof error === "object" && "stdout" in error
      ? String(error.stdout)
      : "";
    let message = error instanceof Error ? error.message : String(error);
    try {
      const parsed = JSON.parse(stdout) as AdminResponse<unknown>;
      if (parsed.errors?.length) {
        message = parsed.errors.map((item) => item.message).join("; ");
      }
    } catch {
      // Keep the original child-process error when the helper output is not JSON.
    }
    throw new Error(message);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function idempotent(key: string) {
  return `@idempotent(key: ${JSON.stringify(key)})`;
}

async function getTargets() {
  const data = await adminRequest<{
    locations: { nodes: Array<{ id: string; name: string }> };
    publications: { nodes: Array<{ id: string; name: string }> };
  }>(`#graphql
    query SyncTargets {
      locations(first: 20) { nodes { id name } }
      publications(first: 20) { nodes { id name } }
    }
  `);

  const location = data.locations.nodes[0];
  const publication =
    data.publications.nodes.find((item) => item.name === "Online Store");

  if (!location) throw new Error("Shopify has no inventory location");
  if (!publication) throw new Error("Shopify has no storefront publication");

  return { location, publication };
}

async function getExistingProducts() {
  const data = await adminRequest<{
    products: { nodes: Array<{ id: string; title: string }> };
  }>(`#graphql
    query ExistingProducts {
      products(first: 250) {
        nodes { id title }
      }
    }
  `);

  return new Map(
    data.products.nodes.map((product) => [
      product.title.trim().toLocaleLowerCase(),
      { ...product, variants: { nodes: [] } },
    ]),
  );
}

async function createProduct(product: {
  name: string;
  description: string;
}, idempotencyKey: string) {
  const data = await adminRequest<{
    productCreate: {
      product: { id: string } | null;
      userErrors: Array<{ message: string }>;
    };
  }>(
    `#graphql
      mutation CreateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) ${idempotent(idempotencyKey)} {
          product { id }
          userErrors { field message }
        }
      }
    `,
    {
      product: {
        title: product.name,
        descriptionHtml: `<p>${escapeHtml(product.description)}</p>`,
        status: "ACTIVE",
      },
    },
  );

  if (data.productCreate.userErrors.length || !data.productCreate.product) {
    throw new Error(
      data.productCreate.userErrors.map((error) => error.message).join("; ") ||
        "Shopify did not return a product",
    );
  }

  return data.productCreate.product.id;
}

async function getVariants(productId: string) {
  const data = await adminRequest<{
    product: { variants: { nodes: ShopifyVariant[] } } | null;
  }>(
    `#graphql
      query ProductVariants($id: ID!) {
        product(id: $id) {
          variants(first: 20) {
            nodes {
              id
              price
              inventoryItem {
                id
                tracked
                inventoryLevels(first: 20) {
                  nodes {
                    location { id }
                    quantities(names: ["available"]) { name quantity }
                  }
                }
              }
            }
          }
        }
      }
    `,
    { id: productId },
  );

  const variant = data.product?.variants.nodes[0];
  if (!variant) throw new Error(`Product ${productId} has no variant`);
  return variant;
}

async function syncProduct(
  product: {
    name: string;
    description: string;
    price: number;
    stock: number;
  },
  existing: ShopifyProduct | undefined,
  locationId: string,
  publicationId: string,
) {
  const productKey = product.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-");
  const productId = existing?.id ?? await createProduct(product, `catalog-create-${productKey}`);
  const variant = existing?.variants.nodes[0] ?? await getVariants(productId);

  await adminRequest(
    `#graphql
      mutation UpdatePrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) ${idempotent(`catalog-price-${productId}`)} {
          productVariants { id price }
          userErrors { field message }
        }
      }
    `,
    {
      productId,
      variants: [{ id: variant.id, price: (product.price / 100).toFixed(2) }],
    },
  );

  if (!variant.inventoryItem.tracked) {
    await adminRequest(
      `#graphql
        mutation TrackInventory($id: ID!, $input: InventoryItemInput!) {
          inventoryItemUpdate(id: $id, input: $input) ${idempotent(`catalog-track-${variant.inventoryItem.id}`)} {
            inventoryItem { id tracked }
            userErrors { field message }
          }
        }
      `,
      { id: variant.inventoryItem.id, input: { tracked: true } },
    );
  }

  const alreadyActive = variant.inventoryItem.inventoryLevels.nodes.some(
    (level) => level.location.id === locationId,
  );
  const currentLevel = variant.inventoryItem.inventoryLevels.nodes.find(
    (level) => level.location.id === locationId,
  );
  const currentQuantity =
    currentLevel?.quantities.find((quantity) => quantity.name === "available")?.quantity ?? 0;
  if (!alreadyActive) {
    await adminRequest(
      `#graphql
        mutation ActivateInventory($inventoryItemId: ID!, $locationId: ID!) {
          inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId) ${idempotent(`catalog-activate-${variant.inventoryItem.id}-${locationId}`)} {
            inventoryLevel { id }
            userErrors { field message }
          }
        }
      `,
      { inventoryItemId: variant.inventoryItem.id, locationId },
    );
  }

  await adminRequest(
    `#graphql
      mutation SetInventory($input: InventorySetQuantitiesInput!) {
        inventorySetQuantities(input: $input) ${idempotent(`catalog-stock-${variant.inventoryItem.id}-${product.stock}`)} {
          inventoryAdjustmentGroup { id }
          userErrors { field message }
        }
      }
    `,
    {
      input: {
        name: "available",
        reason: "correction",
        quantities: [{
          inventoryItemId: variant.inventoryItem.id,
          locationId,
          changeFromQuantity: currentQuantity,
          quantity: product.stock,
        }],
      },
    },
  );

  await adminRequest(
    `#graphql
      mutation PublishProduct($productId: ID!, $publicationId: ID!) {
        publishablePublish(id: $productId, input: [{ publicationId: $publicationId }]) ${idempotent(`catalog-publish-${productId}-${publicationId}`)} {
          publishable { publishedOnPublication(publicationId: $publicationId) }
          userErrors { field message }
        }
      }
    `,
    { productId, publicationId },
  );
}

async function main() {
  const { location, publication } = await getTargets();
  const existingProducts = await getExistingProducts();
  const products = await db.product.findMany({
    orderBy: { id: "asc" },
    select: { name: true, description: true, price: true, stock: true },
  });
  const requestedNames = process.env.SHOPIFY_SYNC_NAMES
    ?.split("|")
    .map((name) => name.trim().toLocaleLowerCase())
    .filter(Boolean);
  const productsToSync = requestedNames?.length
    ? products.filter((product) => requestedNames.includes(product.name.toLocaleLowerCase()))
    : products;

  console.log(
    `Syncing ${productsToSync.length} products to location "${location.name}" and publication "${publication.name}"`,
  );

  for (const product of productsToSync) {
    const existing = existingProducts.get(product.name.trim().toLocaleLowerCase());
    await syncProduct(product, existing, location.id, publication.id);
    console.log(`✓ ${product.name}`);
  }
}

main()
  .catch((error) => {
    console.error(`Catalog sync failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });