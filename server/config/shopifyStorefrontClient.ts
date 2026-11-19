import { env } from "./env";
import { withActiveSpan } from "./tracing";
import {
  isGraphqlError,
  isReadOnlyQuery,
  isRetryableGraphqlError,
  retryDelay,
  safeJsonParse,
  ShopifyStorefrontError,
  statusError,
} from "./shopifyStorefrontPolicy";

export { ShopifyStorefrontError } from "./shopifyStorefrontPolicy";

type ShopifyStorefrontConfig = {
  shopDomain: string;
  storefrontAccessToken: string;
};

type ConfigProvider = typeof getShopifyStorefrontConfig;
type Fetcher = typeof fetch;

const STOREFRONT_API_VERSION = "2026-04";
const CONFIG_CACHE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 10_000;

let cachedConfig:
  | { value: ShopifyStorefrontConfig; expiresAt: number }
  | undefined;

export async function getShopifyStorefrontConfig(
  options: { forceRefresh?: boolean } = {},
): Promise<ShopifyStorefrontConfig> {
  if (cachedConfig && !options.forceRefresh && Date.now() < cachedConfig.expiresAt) {
    return cachedConfig.value;
  }

  if (!env.SHOPIFY_SHOP_DOMAIN || !env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    throw new ShopifyStorefrontError(
      "SHOPIFY_NOT_CONFIGURED",
      "Shopify Storefront integration is not configured",
      503,
      false,
    );
  }

  cachedConfig = {
    value: {
      shopDomain: env.SHOPIFY_SHOP_DOMAIN,
      storefrontAccessToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
  };

  return cachedConfig.value;
}

export function createShopifyStorefrontClient(
  configProvider: ConfigProvider = getShopifyStorefrontConfig,
  fetcher: Fetcher = fetch,
) {
  async function executeRequest<T>(
    query: string,
    variables?: Record<string, unknown>,
    options: { retryOnUnauthorized?: boolean } = {},
  ): Promise<T> {
    const retrySafe = isReadOnlyQuery(query);
    let config = await configProvider();
    let attempts = 0;
    let unauthorizedRefreshed = false;

    while (attempts < 2) {
      attempts += 1;
      let response: Response;
      try {
        response = await fetcher(
          `https://${config.shopDomain}/api/${STOREFRONT_API_VERSION}/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Storefront-Access-Token": config.storefrontAccessToken,
            },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          },
        );
      } catch (error) {
        const timedOut = error instanceof Error && error.name === "TimeoutError";
        if (retrySafe && attempts < 2) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          continue;
        }
        throw new ShopifyStorefrontError(
          timedOut ? "SHOPIFY_REQUEST_TIMEOUT" : "SHOPIFY_NETWORK_ERROR",
          timedOut
            ? "Shopify Storefront API request timed out"
            : "Shopify Storefront API is unreachable",
          503,
          retrySafe,
        );
      }

      if (
        options.retryOnUnauthorized !== false
        && !unauthorizedRefreshed
        && (response.status === 401 || response.status === 403)
      ) {
        unauthorizedRefreshed = true;
        config = await configProvider({ forceRefresh: true });
        if (attempts < 2) continue;
      }

      let text: string;
      try {
        text = await response.text();
      } catch {
        if (retrySafe && attempts < 2) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          continue;
        }
        throw new ShopifyStorefrontError(
          "SHOPIFY_NETWORK_ERROR",
          "Shopify Storefront API response could not be read",
          503,
          retrySafe,
        );
      }
      const json = text ? safeJsonParse(text) : undefined;
      const graphqlRetryable = isRetryableGraphqlError(json);
      const retryableResponse =
        response.status === 429 || response.status >= 500 || graphqlRetryable;

      if (retrySafe && attempts < 2 && retryableResponse) {
        const delay = retryDelay(response);
        if (delay !== null) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      if (!response.ok) throw statusError(response.status, retrySafe);
      if (graphqlRetryable) throw statusError(503, retrySafe);
      if (isGraphqlError(json)) {
        throw new ShopifyStorefrontError(
          "SHOPIFY_GRAPHQL_ERROR",
          "Shopify Storefront API returned a GraphQL error",
          502,
          false,
        );
      }
      if (!json || typeof json !== "object" || !("data" in json)) {
        throw new ShopifyStorefrontError(
          "SHOPIFY_INVALID_RESPONSE",
          "Shopify Storefront API returned an invalid response",
          502,
          false,
        );
      }

      return json.data as T;
    }

    throw statusError(503, retrySafe);
  }

  function operationName(query: string): string {
    return query.match(/\b(?:query|mutation)\s+([A-Za-z_]\w*)/)?.[1] ?? "unknown";
  }

  async function request<T>(
    query: string,
    variables?: Record<string, unknown>,
    options: { retryOnUnauthorized?: boolean } = {},
  ): Promise<T> {
    return withActiveSpan(
      "shopify.storefront.request",
      { "shopify.operation": operationName(query) },
      () => executeRequest<T>(query, variables, options),
    );
  }

  return { request };
}

export const shopifyStorefrontRequest =
  createShopifyStorefrontClient().request;
