export type ShopifyStorefrontErrorCode =
  | "SHOPIFY_NOT_CONFIGURED"
  | "SHOPIFY_RATE_LIMITED"
  | "SHOPIFY_UPSTREAM_UNAVAILABLE"
  | "SHOPIFY_REQUEST_TIMEOUT"
  | "SHOPIFY_NETWORK_ERROR"
  | "SHOPIFY_GRAPHQL_ERROR"
  | "SHOPIFY_REJECTED"
  | "SHOPIFY_INVALID_RESPONSE";

export class ShopifyStorefrontError extends Error {
  constructor(
    readonly code: ShopifyStorefrontErrorCode,
    message: string,
    readonly statusCode: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ShopifyStorefrontError";
  }
}

export function isReadOnlyQuery(query: string) {
  const operation = query.replace(/^\s*#graphql[^\n]*\n?/i, "").trimStart();
  return /^query(?:\s|\{)/i.test(operation);
}

export function retryDelay(response: Response) {
  const value = response.headers.get("retry-after");
  if (!value) return 150;

  const seconds = Number(value);
  const requestedDelay = Number.isFinite(seconds)
    ? seconds * 1_000
    : Date.parse(value) - Date.now();
  return requestedDelay >= 0 && requestedDelay <= 1_000
    ? requestedDelay
    : null;
}

export function isRetryableGraphqlError(json: unknown) {
  if (!json || typeof json !== "object" || !("errors" in json)) return false;
  const errors = json.errors;
  if (!Array.isArray(errors)) return false;
  return errors.some((error) =>
    error && typeof error === "object" && "extensions" in error
    && error.extensions && typeof error.extensions === "object"
    && "code" in error.extensions
    && ["THROTTLED", "INTERNAL_SERVER_ERROR"].includes(String(error.extensions.code))
  );
}

export function statusError(status: number, retryable: boolean) {
  if (status === 429) {
    return new ShopifyStorefrontError(
      "SHOPIFY_RATE_LIMITED",
      "Shopify Storefront API rate limit reached",
      503,
      retryable,
    );
  }
  if (status >= 500) {
    return new ShopifyStorefrontError(
      "SHOPIFY_UPSTREAM_UNAVAILABLE",
      "Shopify Storefront API is temporarily unavailable",
      503,
      retryable,
    );
  }
  return new ShopifyStorefrontError(
    "SHOPIFY_REJECTED",
    "Shopify Storefront API rejected the request",
    502,
    false,
  );
}

export function isGraphqlError(json: unknown) {
  return Boolean(
    json
    && typeof json === "object"
    && "errors" in json
    && Array.isArray(json.errors)
    && json.errors.length > 0,
  );
}

export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
