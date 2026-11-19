import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { db } from "../server/db/client";
import { recordAuditEvent } from "../server/modules/audit/audit.service";

const execFileAsync = promisify(execFile);

type AdminResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
  httpStatus?: number;
};

class ShopifySyncError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ShopifySyncError";
  }
}

function auditErrorCode(error: unknown): string {
  const code = error instanceof ShopifySyncError
    ? error.code
    : error instanceof Error ? error.name : "UNKNOWN_ERROR";
  return /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(code) ? code : "UNKNOWN_ERROR";
}

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
  options: { idempotentMutation?: boolean } = {},
): Promise<T> {
  try {
    const { stdout } = await execFileAsync(
      "node",
      [
        "shopify-admin-api.mjs",
        JSON.stringify({ query, variables }),
        "/admin/api/2026-04/graphql.json",
        String(options.idempotentMutation === true),
      ],
      { maxBuffer: 4 * 1024 * 1024, timeout: 65_000 },
    );
    const parsed = JSON.parse(stdout) as AdminResponse<T>;
    if (parsed.errors?.length) {
      throw new ShopifySyncError(
        parsed.errors[0].extensions?.code ?? "SHOPIFY_GRAPHQL_ERROR",
        parsed.errors.map((error) => error.message).join("; "),
      );
    }
    if (!parsed.data) {
      throw new Error("Shopify Admin API returned no data");
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ShopifySyncError) throw error;
    const stdout = error && typeof error === "object" && "stdout" in error
      ? String(error.stdout)
      : "";
    const message = error instanceof Error ? error.message : String(error);
    let parsed: AdminResponse<unknown> | undefined;
    try {
      parsed = JSON.parse(stdout) as AdminResponse<unknown>;
    } catch {
      parsed = undefined;
    }
    if (parsed?.errors?.length) {
      throw new ShopifySyncError(
        parsed.errors[0].extensions?.code ?? "SHOPIFY_GRAPHQL_ERROR",
        parsed.errors.map((item) => item.message).join("; "),
      );
    }
    if (error && typeof error === "object" && "killed" in error && error.killed) {
      throw new ShopifySyncError("SHOPIFY_TIMEOUT", "Shopify Admin API request timed out");
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
  const products: Array<{ id: string; title: string }> = [];
  let after: string | undefined;

  while (true) {
    const data = await adminRequest<{
      products: {
        nodes: Array<{ id: string; title: string }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(`#graphql
      query ExistingProducts($after: String) {
        products(first: 250, after: $after) {
          nodes { id title }
          pageInfo { hasNextPage endCursor }
        }
      }
    `, { after });
    products.push(...data.products.nodes);

    if (!data.products.pageInfo.hasNextPage) break;
    const next = data.products.pageInfo.endCursor;
    if (!next || next === after) {
      throw new Error("Shopify product pagination returned no next cursor");
    }
    after = next;
  }

  return new Map(
    products.map((product) => [
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
    { idempotentMutation: true },
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
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
  },
  existing: ShopifyProduct | undefined,
  locationId: string,
  publicationId: string,
  syncId: string,
) {
  const productId = existing?.id ?? await createProduct(
    product,
    `catalog-create-${product.id}`,
  );
  const variant = existing?.variants.nodes[0] ?? await getVariants(productId);

  await adminRequest(
    `#graphql
      mutation UpdatePrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) ${idempotent(`${syncId}-price-${productId}`)} {
          productVariants { id price }
          userErrors { field message }
        }
      }
    `,
    {
      productId,
      variants: [{ id: variant.id, price: (product.price / 100).toFixed(2) }],
    },
    { idempotentMutation: true },
  );

  if (!variant.inventoryItem.tracked) {
    await adminRequest(
      `#graphql
        mutation TrackInventory($id: ID!, $input: InventoryItemInput!) {
          inventoryItemUpdate(id: $id, input: $input) ${idempotent(`${syncId}-track-${variant.inventoryItem.id}`)} {
            inventoryItem { id tracked }
            userErrors { field message }
          }
        }
      `,
      { id: variant.inventoryItem.id, input: { tracked: true } },
      { idempotentMutation: true },
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
          inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId) ${idempotent(`${syncId}-activate-${variant.inventoryItem.id}-${locationId}`)} {
            inventoryLevel { id }
            userErrors { field message }
          }
        }
      `,
      { inventoryItemId: variant.inventoryItem.id, locationId },
      { idempotentMutation: true },
    );
  }

  await adminRequest(
    `#graphql
      mutation SetInventory($input: InventorySetQuantitiesInput!) {
        inventorySetQuantities(input: $input) ${idempotent(`${syncId}-stock-${variant.inventoryItem.id}`)} {
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
    { idempotentMutation: true },
  );

  await adminRequest(
    `#graphql
      mutation PublishProduct($productId: ID!, $publicationId: ID!) {
        publishablePublish(id: $productId, input: [{ publicationId: $publicationId }]) ${idempotent(`${syncId}-publish-${productId}-${publicationId}`)} {
          publishable { publishedOnPublication(publicationId: $publicationId) }
          userErrors { field message }
        }
      }
    `,
    { productId, publicationId },
    { idempotentMutation: true },
  );
}

async function main() {
  const operationId = randomUUID();
  let productCount: number | undefined;
  recordAuditEvent({ event: "shopify.catalog.sync.started", operationId });

  try {
    const { location, publication } = await getTargets();
    const existingProducts = await getExistingProducts();
    const products = await db.product.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, description: true, price: true, stock: true },
    });
    const requestedNames = process.env.SHOPIFY_SYNC_NAMES
      ?.split("|")
      .map((name) => name.trim().toLocaleLowerCase())
      .filter(Boolean);
    const productsToSync = requestedNames?.length
      ? products.filter((product) => requestedNames.includes(product.name.toLocaleLowerCase()))
      : products;
    productCount = productsToSync.length;

    console.log(
      `Syncing ${productsToSync.length} products to location "${location.name}" and publication "${publication.name}"`,
    );

    for (const product of productsToSync) {
      const existing = existingProducts.get(product.name.trim().toLocaleLowerCase());
      await syncProduct(product, existing, location.id, publication.id, operationId);
      console.log(`✓ ${product.name}`);
    }

    recordAuditEvent({
      event: "shopify.catalog.sync.succeeded",
      operationId,
      productCount,
    });
  } catch (error) {
    recordAuditEvent({
      event: "shopify.catalog.sync.failed",
      operationId,
      ...(productCount === undefined ? {} : { productCount }),
      errorCode: auditErrorCode(error),
    });
    throw error;
  }
}

main()
  .catch((error) => {
    const code = error instanceof ShopifySyncError ? `[${error.code}] ` : "";
    console.error(`Catalog sync failed: ${code}${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });