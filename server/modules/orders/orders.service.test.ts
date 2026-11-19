import assert from "node:assert/strict";
import test from "node:test";
import {
  createOrderCreator,
  createOrderRequestHash,
  type CreateOrderInput,
  type IdempotencyOrderFinder,
  type OrderTransaction,
  type OrderTransactionRunner,
  type OrderWithItems,
} from "./orders.service";
import { ConflictError, ValidationError } from "../../utils/errors";

const input: CreateOrderInput = {
  total: 240,
  address: "12 Oak Street",
  items: [
    { productId: 7, name: "Oak Chair", price: 120, quantity: 2, image: "chair.jpg" },
  ],
};
const idempotencyKey = "order-request-key-2026-001";
const requestHash = createOrderRequestHash(input);

const createdOrder: OrderWithItems = {
  id: 1,
  userId: 42,
  total: input.total,
  status: "Processing",
  address: input.address,
  idempotencyKey,
  idempotencyHash: requestHash,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  items: [],
};

function createHarness(
  overrides: Partial<OrderTransaction> = {},
  findCommittedOrder: IdempotencyOrderFinder = async () => null,
) {
  const calls: string[] = [];
  let committed = false;
  let rolledBack = false;

  const transaction: OrderTransaction = {
    findOrderByIdempotencyKey: async () => null,
    reserveStock: async (productId, quantity) => {
      calls.push(`reserve:${productId}:${quantity}`);
      return true;
    },
    createOrder: async (userId, orderInput, key, hash) => {
      calls.push(`create:${userId}`);
      return {
        ...createdOrder,
        total: orderInput.total,
        address: orderInput.address,
        idempotencyKey: key,
        idempotencyHash: hash,
      };
    },
    clearCart: async (userId) => {
      calls.push(`clear:${userId}`);
    },
    ...overrides,
  };

  const runTransaction: OrderTransactionRunner = async <T>(
    operation: (transaction: OrderTransaction) => Promise<T>,
  ): Promise<T> => {
    try {
      const result = await operation(transaction);
      committed = true;
      return result;
    } catch (error) {
      rolledBack = true;
      throw error;
    }
  };

  return {
    create: (userId = 42, orderInput = input, key = idempotencyKey) =>
      createOrderCreator(runTransaction, findCommittedOrder)(
        userId,
        orderInput,
        key,
        createOrderRequestHash(orderInput),
      ),
    calls,
    wasCommitted: () => committed,
    wasRolledBack: () => rolledBack,
  };
}

test("order creation reserves stock, saves the order, then clears the cart in one transaction", async () => {
  const harness = createHarness();

  const order = await harness.create();

  assert.deepEqual(order, createdOrder);
  assert.deepEqual(harness.calls, ["reserve:7:2", "create:42", "clear:42"]);
  assert.equal(harness.wasCommitted(), true);
  assert.equal(harness.wasRolledBack(), false);
});

test("insufficient stock rejects the transaction before creating the order or clearing the cart", async () => {
  const harness = createHarness({
    reserveStock: async () => false,
  });

  await assert.rejects(harness.create(), ValidationError);

  assert.deepEqual(harness.calls, []);
  assert.equal(harness.wasCommitted(), false);
  assert.equal(harness.wasRolledBack(), true);
});

test("partial stock reservation rolls back when a later item is unavailable", async () => {
  const reservations: string[] = [];
  const harness = createHarness({
    reserveStock: async (productId, quantity) => {
      reservations.push(`reserve:${productId}:${quantity}`);
      return productId === 7;
    },
  });
  const multipleItems: CreateOrderInput = {
    ...input,
    items: [
      ...input.items,
      { productId: 8, name: "Oak Table", price: 240, quantity: 1, image: "table.jpg" },
    ],
  };

  await assert.rejects(harness.create(42, multipleItems), ValidationError);

  assert.deepEqual(reservations, ["reserve:7:2", "reserve:8:1"]);
  assert.deepEqual(harness.calls, []);
  assert.equal(harness.wasCommitted(), false);
  assert.equal(harness.wasRolledBack(), true);
});

test("order write failure rolls back reserved stock and skips cart cleanup", async () => {
  let createAttempted = false;
  const harness = createHarness({
    createOrder: async () => {
      createAttempted = true;
      throw new Error("order write failed");
    },
  });

  await assert.rejects(harness.create(), /order write failed/);

  assert.equal(createAttempted, true);
  assert.deepEqual(harness.calls, ["reserve:7:2"]);
  assert.equal(harness.wasCommitted(), false);
  assert.equal(harness.wasRolledBack(), true);
});

test("cart cleanup failure rejects the order transaction instead of leaving a partial success", async () => {
  const harness = createHarness({
    clearCart: async () => {
      throw new Error("cart cleanup failed");
    },
  });

  await assert.rejects(harness.create(), /cart cleanup failed/);

  assert.deepEqual(harness.calls, ["reserve:7:2", "create:42"]);
  assert.equal(harness.wasCommitted(), false);
  assert.equal(harness.wasRolledBack(), true);
});

test("repeated order requests replay the existing order without mutating stock or cart", async () => {
  const harness = createHarness({
    findOrderByIdempotencyKey: async () => createdOrder,
  });

  const order = await harness.create();

  assert.equal(order, createdOrder);
  assert.deepEqual(harness.calls, []);
  assert.equal(harness.wasCommitted(), true);
});

test("reusing an idempotency key with a different payload returns a conflict", async () => {
  const harness = createHarness({
    findOrderByIdempotencyKey: async () => createdOrder,
  });
  const changedInput = { ...input, address: "99 Pine Street" };

  await assert.rejects(harness.create(42, changedInput), ConflictError);
  assert.deepEqual(harness.calls, []);
});

test("a concurrent duplicate resolves to the committed order after transaction rollback", async () => {
  const harness = createHarness(
    {
      createOrder: async () => {
        throw new Error("unique constraint violation");
      },
    },
    async () => createdOrder,
  );

  const order = await harness.create();

  assert.equal(order, createdOrder);
  assert.equal(harness.wasRolledBack(), true);
});
