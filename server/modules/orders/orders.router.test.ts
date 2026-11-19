import assert from "node:assert/strict";
import test from "node:test";
import { startHttpTestServer } from "../../test-utils/http";
import { createOrderRequestHash, OrdersService } from "./orders.service";
import {
  createOrdersRouter,
  type OrderProduct,
  type OrdersRouterService,
} from "./orders.router";

const product: OrderProduct = {
  id: 7,
  name: "Oak Chair",
  price: 120,
  image: "chair.jpg",
  stock: 5,
};

const order = {
  id: 11,
  userId: 42,
  total: 240,
  status: "Processing",
  address: "12 Oak Street",
  idempotencyKey: "order-request-key-2026-001",
  idempotencyHash: "0".repeat(64),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  items: [],
} satisfies Awaited<ReturnType<typeof OrdersService.create>>;

function createHarness(
  products: OrderProduct[] = [product],
  existingOrder?: typeof order,
) {
  const createCalls: Array<{
    userId: number;
    total: number;
    idempotencyKey: string;
    requestHash: string;
  }> = [];
  let findProductsCalls = 0;
  const service: OrdersRouterService = {
    async create(userId, input, idempotencyKey, requestHash) {
      createCalls.push({ userId, total: input.total, idempotencyKey, requestHash });
      return {
        ...order,
        total: input.total,
        address: input.address,
        idempotencyKey,
        idempotencyHash: requestHash,
      };
    },
    async findByIdempotencyKey(_userId, idempotencyKey, requestHash) {
      return existingOrder?.idempotencyKey === idempotencyKey
        && existingOrder.idempotencyHash === requestHash
        ? existingOrder
        : null;
    },
    async getByUser() {
      return [];
    },
    async getById() {
      return order;
    },
  };
  return {
    createCalls,
    findProductsCalls: () => findProductsCalls,
    router: createOrdersRouter({
      service,
      findProducts: async () => {
        findProductsCalls += 1;
        return products;
      },
    }),
  };
}

test("order route uses database prices and submits an authenticated order", async (t) => {
  const harness = createHarness();
  const baseUrl = await startHttpTestServer(t, harness.router, {
    mountPath: "/api/orders",
    userId: 42,
  });

  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "order-request-key-2026-001",
    },
    body: JSON.stringify({
      address: "12 Oak Street",
      items: [{ productId: 7, quantity: 2, price: 1 }],
    }),
  });

  assert.equal(response.status, 201);
  const responseOrder = await response.json();
  assert.equal(responseOrder.total, 240);
  assert.equal("idempotencyKey" in responseOrder, false);
  assert.equal("idempotencyHash" in responseOrder, false);
  assert.deepEqual(harness.createCalls, [{
    userId: 42,
    total: 240,
    idempotencyKey: "order-request-key-2026-001",
    requestHash: createOrderRequestHash({
      address: "12 Oak Street",
      items: [{ productId: 7, quantity: 2 }],
    }),
  }]);
});

test("order route supports repeated product lines and rejects missing or insufficient stock", async (t) => {
  const repeated = createHarness();
  const repeatedUrl = await startHttpTestServer(t, repeated.router, {
    mountPath: "/api/orders",
    userId: 42,
  });
  const repeatedResponse = await fetch(`${repeatedUrl}/api/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "order-request-key-2026-002",
    },
    body: JSON.stringify({
      address: "12 Oak Street",
      items: [
        { productId: 7, quantity: 2 },
        { productId: 7, quantity: 1 },
      ],
    }),
  });
  assert.equal(repeatedResponse.status, 201);
  assert.equal((await repeatedResponse.json()).total, 360);

  const missing = createHarness([]);
  const missingUrl = await startHttpTestServer(t, missing.router, {
    mountPath: "/api/orders",
    userId: 42,
  });
  const missingResponse = await fetch(`${missingUrl}/api/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "order-request-key-2026-003",
    },
    body: JSON.stringify({ address: "12 Oak Street", items: [{ productId: 7, quantity: 1 }] }),
  });
  assert.equal(missingResponse.status, 400);
  assert.deepEqual(missing.createCalls, []);

  const lowStock = createHarness([{ ...product, stock: 1 }]);
  const lowStockUrl = await startHttpTestServer(t, lowStock.router, {
    mountPath: "/api/orders",
    userId: 42,
  });
  const lowStockResponse = await fetch(`${lowStockUrl}/api/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "order-request-key-2026-004",
    },
    body: JSON.stringify({ address: "12 Oak Street", items: [{ productId: 7, quantity: 2 }] }),
  });
  assert.equal(lowStockResponse.status, 400);
  assert.deepEqual(lowStock.createCalls, []);
});

test("order route rejects unauthenticated and malformed order requests", async (t) => {
  const harness = createHarness();
  const unauthorizedUrl = await startHttpTestServer(t, harness.router, {
    mountPath: "/api/orders",
  });
  const unauthorized = await fetch(`${unauthorizedUrl}/api/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "order-request-key-2026-005",
    },
    body: JSON.stringify({ address: "12 Oak Street", items: [{ productId: 7, quantity: 1 }] }),
  });
  assert.equal(unauthorized.status, 401);

  const baseUrl = await startHttpTestServer(t, harness.router, {
    mountPath: "/api/orders",
    userId: 42,
  });
  const invalid = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "order-request-key-2026-006",
    },
    body: JSON.stringify({ address: "", items: [{ productId: 7, quantity: 51 }] }),
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual(harness.createCalls, []);
});

test("order route requires a valid idempotency key", async (t) => {
  const harness = createHarness();
  const baseUrl = await startHttpTestServer(t, harness.router, {
    mountPath: "/api/orders",
    userId: 42,
  });

  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      address: "12 Oak Street",
      items: [{ productId: 7, quantity: 1 }],
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(harness.createCalls, []);
});

test("order retry replays before product lookup and omits internal idempotency fields", async (t) => {
  const body = {
    address: "12 Oak Street",
    items: [{ productId: 7, quantity: 2 }],
  };
  const key = "order-request-key-2026-008";
  const requestHash = createOrderRequestHash(body);
  const existingOrder = {
    ...order,
    idempotencyKey: key,
    idempotencyHash: requestHash,
  };
  const harness = createHarness([], existingOrder);
  const baseUrl = await startHttpTestServer(t, harness.router, {
    mountPath: "/api/orders",
    userId: 42,
  });

  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(body),
  });

  assert.equal(response.status, 201);
  assert.equal(harness.findProductsCalls(), 0);
  assert.deepEqual(harness.createCalls, []);
  const responseOrder = await response.json();
  assert.equal(responseOrder.idempotencyKey, undefined);
  assert.equal(responseOrder.idempotencyHash, undefined);
});
