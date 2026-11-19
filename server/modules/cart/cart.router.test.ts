import assert from "node:assert/strict";
import test from "node:test";
import { startHttpTestServer } from "../../test-utils/http";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import { CartService, createCartItemAdder, createCartItemMutator } from "./cart.service";
import { createCartRouter, type CartRouterService } from "./cart.router";

function createService(): { service: CartRouterService; calls: string[] } {
  const calls: string[] = [];
  const item = { id: 3, userId: 42, productId: 7, quantity: 2 };
  return {
    calls,
    service: {
      async getByUser(userId) {
        calls.push(`list:${userId}`);
        return [];
      },
      async add(userId, productId, quantity) {
        calls.push(`add:${userId}:${productId}:${quantity}`);
        return { ...item, userId, productId, quantity };
      },
      async updateQuantity(userId, id, quantity) {
        calls.push(`update:${userId}:${id}:${quantity}`);
        return quantity === 0 ? null : { ...item, userId, id, quantity };
      },
      async remove(userId, id) {
        calls.push(`remove:${userId}:${id}`);
      },
      async clear(userId) {
        calls.push(`clear:${userId}`);
      },
    },
  };
}

test("cart add verifies the product and atomically upserts its quantity", async () => {
  const calls: unknown[] = [];
  const add = createCartItemAdder(
    async (productId) => ({ id: productId }),
    async (input) => {
      calls.push(input);
      return input;
    },
  );

  const result = await add(42, 7, 3);

  assert.deepEqual(result, { userId: 42, productId: 7, quantity: 3 });
  assert.deepEqual(calls, [{ userId: 42, productId: 7, quantity: 3 }]);
});

test("cart add does not upsert a missing product", async () => {
  let upsertCalls = 0;
  const add = createCartItemAdder(
    async () => null,
    async () => {
      upsertCalls += 1;
    },
  );

  await assert.rejects(add(42, 404), NotFoundError);
  assert.equal(upsertCalls, 0);
});

test("cart quantity updates pass user ownership into the atomic database write", async () => {
  const inputs: unknown[] = [];
  const update = createCartItemMutator(
    async (id) => ({ id, userId: 42 }),
    async (input) => {
      inputs.push(input);
      return { ...input, productId: 7 };
    },
    async () => true,
  );

  const result = await update.updateQuantity(42, 3, 5);

  assert.deepEqual(result, { id: 3, userId: 42, quantity: 5, productId: 7 });
  assert.deepEqual(inputs, [{ id: 3, userId: 42, quantity: 5 }]);
});

test("cart mutation rejects a different owner before writing", async () => {
  let writeCalls = 0;
  const mutator = createCartItemMutator(
    async (id) => ({ id, userId: 99 }),
    async () => {
      writeCalls += 1;
      return null;
    },
    async () => {
      writeCalls += 1;
      return false;
    },
  );

  await assert.rejects(mutator.remove(42, 3), ForbiddenError);
  assert.equal(writeCalls, 0);
});

test("cart quantity zero uses the owner-scoped delete", async () => {
  const inputs: unknown[] = [];
  const mutator = createCartItemMutator(
    async (id) => ({ id, userId: 42 }),
    async () => null,
    async (input) => {
      inputs.push(input);
      return true;
    },
  );

  assert.equal(await mutator.updateQuantity(42, 3, 0), null);
  assert.deepEqual(inputs, [{ id: 3, userId: 42 }]);
});

test("cart removal reports not found when another request already deleted the item", async () => {
  const mutator = createCartItemMutator(
    async (id) => ({ id, userId: 42 }),
    async () => null,
    async () => false,
  );

  await assert.rejects(mutator.remove(42, 3), NotFoundError);
});

test("cart routes authenticate, default quantity, and support removal by zero quantity", async (t) => {
  const { service, calls } = createService();
  const baseUrl = await startHttpTestServer(t, createCartRouter(service), {
    mountPath: "/api/cart",
    userId: 42,
  });

  const list = await fetch(`${baseUrl}/api/cart`);
  assert.equal(list.status, 200);
  assert.deepEqual(await list.json(), []);

  const add = await fetch(`${baseUrl}/api/cart`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productId: 7 }),
  });
  assert.equal(add.status, 200);
  assert.deepEqual(calls.slice(0, 2), ["list:42", "add:42:7:1"]);

  const removeByQuantity = await fetch(`${baseUrl}/api/cart/3`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ quantity: 0 }),
  });
  assert.equal(removeByQuantity.status, 204);
  assert.equal(calls[2], "update:42:3:0");
});

test("cart route rejects unauthenticated and invalid requests without calling the service", async (t) => {
  const { service, calls } = createService();
  const baseUrl = await startHttpTestServer(t, createCartRouter(service), {
    mountPath: "/api/cart",
  });

  const unauthorized = await fetch(`${baseUrl}/api/cart`);
  assert.equal(unauthorized.status, 401);

  const authorizedBaseUrl = await startHttpTestServer(t, createCartRouter(service), {
    mountPath: "/api/cart",
    userId: 42,
  });
  const invalid = await fetch(`${authorizedBaseUrl}/api/cart`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productId: 0, quantity: -1 }),
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual(calls, []);
});

test("cart route maps item-not-found errors to 404", async (t) => {
  const service: CartRouterService = {
    ...createService().service,
    async remove() {
      throw new NotFoundError("Cart item");
    },
  };
  const baseUrl = await startHttpTestServer(t, createCartRouter(service), {
    mountPath: "/api/cart",
    userId: 42,
  });

  const response = await fetch(`${baseUrl}/api/cart/404`, { method: "DELETE" });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).code, "NOT_FOUND");
});
