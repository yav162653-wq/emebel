type ShopifyStorefrontConfig = {
  shopDomain: string;
  storefrontAccessToken: string;
};

const STOREFRONT_API_VERSION = "2026-04";
const CONFIG_CACHE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 10_000;

import { env } from "./env";

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
    throw new Error(
      "Shopify Storefront integration requires SHOPIFY_SHOP_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN",
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

export async function shopifyStorefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: { retryOnUnauthorized?: boolean } = {},
): Promise<T> {
  const config = await getShopifyStorefrontConfig();
  const resp = await fetch(
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

  if (
    options.retryOnUnauthorized !== false &&
    (resp.status === 401 || resp.status === 403)
  ) {
    cachedConfig = undefined;
    await getShopifyStorefrontConfig({ forceRefresh: true });
    return shopifyStorefrontRequest<T>(query, variables, {
      retryOnUnauthorized: false,
    });
  }

  const text = await resp.text();
  const json = text ? safeJsonParse(text) : {};
  if (!resp.ok || json.errors?.length) {
    throw new Error(
      `Shopify Storefront API error (${resp.status}): ${JSON.stringify(json.errors ?? json)}`,
    );
  }

  return json.data as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { errors: [{ message: text }] };
  }
}