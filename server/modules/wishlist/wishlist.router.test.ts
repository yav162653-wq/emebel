import assert from "node:assert/strict";
import test from "node:test";
import { startHttpTestServer } from "../../test-utils/http";
import { WishlistService } from "./wishlist.service";
import { createWishlistRouter, type WishlistRouterService } from "./wishlist.router";

function createService(): { service: WishlistRouterService; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    service: {
      async getIds(userId) {
        calls.push(`list:${userId}`);
        return [7];
      },
      async add(userId, productId) {
        calls.push(`add:${userId}:${productId}`);
      },
      async remove(userId, productId) {
        calls.push(`remove:${userId}:${productId}`);
      },
      async clear(userId) {
        calls.push(`clear:${userId}`);
      },
      async sync(userId, productIds) {
        calls.push(`sync:${userId}:${productIds.join(",")}`);
      },
    },
  };
}

test("wishlist routes return and mutate the authenticated user's items", async (t) => {
  const { service, calls } = createService();
  const baseUrl = await startHttpTestServer(t, createWishlistRouter(service), {
    mountPath: "/api/wishlist",
    userId: 42,
  });

  const list = await fetch(`${baseUrl}/api/wishlist`);
  assert.equal(list.status, 200);
  assert.deepEqual(await list.json(), [7]);

  const add = await fetch(`${baseUrl}/api/wishlist/8`, { method: "POST" });
  assert.equal(add.status, 204);

  const sync = await fetch(`${baseUrl}/api/wishlist/sync`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productIds: [] }),
  });
  assert.equal(sync.status, 200);
  assert.deepEqual(await sync.json(), [7]);
  assert.deepEqual(calls, ["list:42", "add:42:8", "sync:42:", "list:42"]);
});

test("wishlist route rejects unauthenticated and invalid identifiers", async (t) => {
  const { service, calls } = createService();
  const unauthorizedUrl = await startHttpTestServer(t, createWishlistRouter(service), {
    mountPath: "/api/wishlist",
  });
  const unauthorized = await fetch(`${unauthorizedUrl}/api/wishlist`);
  assert.equal(unauthorized.status, 401);

  const baseUrl = await startHttpTestServer(t, createWishlistRouter(service), {
    mountPath: "/api/wishlist",
    userId: 42,
  });
  const invalidId = await fetch(`${baseUrl}/api/wishlist/nope`, { method: "POST" });
  assert.equal(invalidId.status, 400);
  const invalidSync = await fetch(`${baseUrl}/api/wishlist/sync`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productIds: [1, 0] }),
  });
  assert.equal(invalidSync.status, 400);
  assert.deepEqual(calls, []);
});
