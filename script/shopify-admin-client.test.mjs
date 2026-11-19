import assert from "node:assert/strict";
import test from "node:test";
import {
  requestShopifyAdmin,
  ShopifyAdminRequestError,
} from "./shopify-admin-client.mjs";

const query = "#graphql\nquery ShopName { shop { name } }";
const safeMutation =
  "#graphql\nmutation UpdatePrice { updatePrice @idempotent(key: \"sync-1\") { userErrors { message } } }";
const unsafeMutation =
  "#graphql\nmutation CreateCart { cartCreate { cart { id } } }\n# @idempotent(key: \"not-a-real-directive\")";

function response(status, body, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

test("retries a transient failure for a read-only Admin query", async () => {
  let calls = 0;
  const result = await requestShopifyAdmin({
    shopDomain: "example.myshopify.com",
    accessToken: "test-token",
    body: { query },
    fetcher: async () => {
      calls += 1;
      return calls === 1
        ? response(503, {})
        : response(200, { data: { shop: { name: "Example" } } });
    },
  });

  assert.equal(calls, 2);
  assert.deepEqual(result.data, { shop: { name: "Example" } });
});

test("retries an idempotent mutation but does not replay a cart mutation", async () => {
  let idempotentCalls = 0;
  await requestShopifyAdmin({
    shopDomain: "example.myshopify.com",
    accessToken: "test-token",
    body: { query: safeMutation },
    retrySafeMutation: true,
    fetcher: async () => {
      idempotentCalls += 1;
      return idempotentCalls === 1
        ? response(503, {})
        : response(200, { data: { updatePrice: { userErrors: [] } } });
    },
  });
  assert.equal(idempotentCalls, 2);

  let cartCalls = 0;
  await assert.rejects(
    requestShopifyAdmin({
      shopDomain: "example.myshopify.com",
      accessToken: "test-token",
      body: { query: unsafeMutation },
      fetcher: async () => {
        cartCalls += 1;
        return response(503, {});
      },
    }),
    (error) => error instanceof ShopifyAdminRequestError
      && error.code === "SHOPIFY_UPSTREAM_UNAVAILABLE",
  );
  assert.equal(cartCalls, 1);
});

test("does not retry GraphQL validation errors", async () => {
  let calls = 0;
  await assert.rejects(
    requestShopifyAdmin({
      shopDomain: "example.myshopify.com",
      accessToken: "test-token",
      body: { query: safeMutation },
      fetcher: async () => {
        calls += 1;
        return response(200, {
          data: { updatePrice: { userErrors: [{ message: "Invalid price" }] } },
        });
      },
    }),
    (error) => error instanceof ShopifyAdminRequestError
      && error.code === "SHOPIFY_REJECTED",
  );
  assert.equal(calls, 1);
});
