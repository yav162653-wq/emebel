import {
  shopifyStorefrontRequest,
  ShopifyStorefrontError,
} from "../../config/shopifyStorefrontClient";
import { applicationMetrics } from "../../config/metrics";
import { AppError, ConflictError, ValidationError } from "../../utils/errors";

type LocalProduct = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

type CheckoutItem = {
  product: LocalProduct;
  quantity: number;
};

type ShopifyVariant = {
  id: string;
  availableForSale: boolean;
  price: {
    amount: string;
    currencyCode: string;
  };
};

type ShopifyProduct = {
  title: string;
  variants: { nodes: ShopifyVariant[] };
};

async function storefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
) {
  try {
    return await shopifyStorefrontRequest<T>(query, variables);
  } catch (error) {
    if (error instanceof ShopifyStorefrontError) {
      applicationMetrics.recordProviderFailure("shopify", error.code);
      throw new AppError(error.message, error.statusCode, error.code);
    }
    throw error;
  }
}

const PRODUCTS_QUERY = `#graphql
  query ProductsForCheckout {
    products(first: 250) {
      nodes {
        title
        variants(first: 20) {
          nodes {
            id
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

const CART_CREATE_MUTATION = `#graphql
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

async function getShopifyProducts() {
  const data = await storefrontRequest<{
    products: { nodes: ShopifyProduct[] };
  }>(PRODUCTS_QUERY);

  return data.products.nodes;
}

export const ShopifyService = {
  async createCheckoutUrl(
    items: CheckoutItem[],
    email?: string,
  ): Promise<string> {
    const shopifyProducts = await getShopifyProducts();
    const productsByName = new Map(
      shopifyProducts.map((product) => [normalizeName(product.title), product]),
    );

    const lines = items.map(({ product, quantity }) => {
      if (product.stock < quantity) {
        throw new ValidationError(`Insufficient stock for "${product.name}"`);
      }

      const shopifyProduct = productsByName.get(normalizeName(product.name));
      if (!shopifyProduct) {
        throw new AppError(
          `Product "${product.name}" is not published in Shopify yet`,
          503,
          "SHOPIFY_CATALOG_NOT_READY",
        );
      }

      const variant = shopifyProduct.variants.nodes.find(
        (candidate) => candidate.availableForSale,
      );
      if (!variant) {
        throw new ConflictError(`Product "${product.name}" is currently unavailable`);
      }

      const priceInCents = Math.round(Number(variant.price.amount) * 100);
      if (
        variant.price.currencyCode !== "USD" ||
        priceInCents !== product.price
      ) {
        throw new AppError(
          `Price or currency mismatch for "${product.name}". Please contact support.`,
          409,
          "SHOPIFY_PRICE_MISMATCH",
        );
      }

      return {
        merchandiseId: variant.id,
        quantity,
      };
    });

    const input: {
      lines: Array<{ merchandiseId: string; quantity: number }>;
      buyerIdentity?: { email: string };
    } = { lines };

    if (email) {
      input.buyerIdentity = { email };
    }

    const data = await storefrontRequest<{
      cartCreate: {
        cart: { checkoutUrl: string } | null;
        userErrors: Array<{ field?: string[]; message: string }>;
      };
    }>(CART_CREATE_MUTATION, { input });

    const error = data.cartCreate.userErrors[0];
    if (error) {
      throw new AppError(error.message, 502, "SHOPIFY_CHECKOUT_ERROR");
    }

    if (!data.cartCreate.cart?.checkoutUrl) {
      throw new AppError(
        "Shopify did not return a checkout URL",
        502,
        "SHOPIFY_CHECKOUT_ERROR",
      );
    }

    const checkoutUrl = new URL(data.cartCreate.cart.checkoutUrl);
    if (process.env.NODE_ENV !== "production") {
      checkoutUrl.searchParams.set("channel", "online_store");
    }

    return checkoutUrl.toString();
  },
};