import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createShopifyStorefrontClient,
  ShopifyStorefrontError,
} from "./shopifyStorefrontClient";

const config = async () => ({
  shopDomain: "example.myshopify.com",
  storefrontAccessToken: "test-token",
});
const query = "#graphql\nquery Products { products { nodes { id } } }";
const mutation = "#graphql\nmutation CartCreate { cartCreate { cart { id } } }";

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

describe("Shopify Storefront retry policy", () => {
  it("retries a transient read-only query once", async () => {
    let calls = 0;
    const client = createShopifyStorefrontClient(config, async () => {
      calls += 1;
      return calls === 1
        ? response(503, {})
        : response(200, { data: { products: { nodes: [] } } });
    });

    assert.deepEqual(await client.request(query), { products: { nodes: [] } });
    assert.equal(calls, 2);
  });

  it("does not replay a cart creation mutation after an upstream failure", async () => {
    let calls = 0;
    const client = createShopifyStorefrontClient(config, async () => {
      calls += 1;
      return response(503, {});
    });

    await assert.rejects(
      client.request(mutation),
      (error) => error instanceof ShopifyStorefrontError
        && error.code === "SHOPIFY_UPSTREAM_UNAVAILABLE"
        && !error.retryable,
    );
    assert.equal(calls, 1);
  });

  it("classifies an ambiguous mutation timeout without retrying", async () => {
    let calls = 0;
    const client = createShopifyStorefrontClient(config, async () => {
      calls += 1;
      const error = new Error("timeout");
      error.name = "TimeoutError";
      throw error;
    });

    await assert.rejects(
      client.request(mutation),
      (error) => error instanceof ShopifyStorefrontError
        && error.code === "SHOPIFY_REQUEST_TIMEOUT"
        && error.statusCode === 503,
    );
    assert.equal(calls, 1);
  });
});
