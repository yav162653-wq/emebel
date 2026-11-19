import { setTimeout as sleep } from "node:timers/promises";

const MAX_ATTEMPTS = 2;
const MAX_RETRY_DELAY_MS = 1_000;
const REQUEST_TIMEOUT_MS = 30_000;

export class ShopifyAdminRequestError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "ShopifyAdminRequestError";
    this.code = code;
    this.status = status;
  }
}

function isReadOnlyQuery(query) {
  const operation = query.replace(/^\s*#graphql[^\n]*\n?/i, "").trimStart();
  return /^query(?:\s|\{)/i.test(operation);
}

function retryDelay(response, attempt) {
  const value = response.headers.get("retry-after");
  if (value) {
    const seconds = Number(value);
    const requestedDelay = Number.isFinite(seconds)
      ? seconds * 1_000
      : Date.parse(value) - Date.now();
    return requestedDelay >= 0 && requestedDelay <= MAX_RETRY_DELAY_MS
      ? requestedDelay
      : null;
  }
  return 150 * 2 ** attempt;
}

function errorCode(status, errors = []) {
  if (status === 429 || errors.some((error) =>
    error?.extensions?.code === "THROTTLED" || error?.extensions?.code === "RATE_LIMITED"
  )) return "SHOPIFY_RATE_LIMITED";
  if (status >= 500 || errors.some((error) =>
    error?.extensions?.code === "INTERNAL_SERVER_ERROR"
  )) return "SHOPIFY_UPSTREAM_UNAVAILABLE";
  if (status) return "SHOPIFY_REJECTED";
  return "SHOPIFY_GRAPHQL_ERROR";
}

function findUserErrors(value) {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(findUserErrors);
  const ownErrors = Array.isArray(value.userErrors) ? value.userErrors : [];
  return [
    ...ownErrors.filter((error) => typeof error?.message === "string"),
    ...Object.entries(value)
      .filter(([key]) => key !== "userErrors")
      .flatMap(([, child]) => findUserErrors(child)),
  ];
}

export async function requestShopifyAdmin({
  shopDomain,
  accessToken,
  body,
  path = "/admin/api/2026-04/graphql.json",
  retrySafeMutation = false,
  fetcher = globalThis.fetch,
}) {
  if (!body || typeof body.query !== "string") {
    throw new ShopifyAdminRequestError(
      "SHOPIFY_INVALID_REQUEST",
      "Shopify Admin API request must include a GraphQL query",
    );
  }

  const retrySafe = isReadOnlyQuery(body.query) || retrySafeMutation;
  const url = `https://${shopDomain}${path}`;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetcher(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify(body),
        signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      if (retrySafe && attempt === 0) {
        await sleep(150);
        continue;
      }
      throw new ShopifyAdminRequestError(
        timedOut ? "SHOPIFY_TIMEOUT" : "SHOPIFY_NETWORK_ERROR",
        timedOut ? "Shopify Admin API request timed out" : "Shopify Admin API is unreachable",
      );
    }

    let text;
    try {
      text = await response.text();
    } catch {
      if (retrySafe && attempt === 0) {
        await sleep(150);
        continue;
      }
      throw new ShopifyAdminRequestError(
        "SHOPIFY_NETWORK_ERROR",
        "Shopify Admin API response could not be read",
        response.status,
      );
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }

    const errors = Array.isArray(parsed?.errors) ? parsed.errors : [];
    const userErrors = findUserErrors(parsed?.data);
    const retryableGraphqlError = errors.some((error) =>
      ["THROTTLED", "INTERNAL_SERVER_ERROR"].includes(error?.extensions?.code)
    );
    const retryableResponse =
      response.status === 429
      || response.status >= 500
      || retryableGraphqlError;

    if (retrySafe && attempt === 0 && retryableResponse) {
      const delay = retryDelay(response, attempt);
      if (delay !== null) {
        await sleep(delay);
        continue;
      }
    }

    if (!response.ok || errors.length || userErrors.length || !parsed) {
      const code = parsed
        ? errorCode(response.status, errors)
        : "SHOPIFY_INVALID_RESPONSE";
      const message = errors[0]?.message
        ?? userErrors[0]?.message
        ?? `Shopify Admin API returned HTTP ${response.status}`;
      throw new ShopifyAdminRequestError(code, message, response.status);
    }

    return parsed;
  }

  throw new ShopifyAdminRequestError(
    "SHOPIFY_UPSTREAM_UNAVAILABLE",
    "Shopify Admin API retry limit was reached",
  );
}
