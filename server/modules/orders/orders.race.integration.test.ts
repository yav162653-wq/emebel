import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { db } from "../../db/client";
import {
  createOrderRequestHash,
  OrdersService,
  type CreateOrderInput,
} from "./orders.service";
import { createIntegrationFixture } from "../../test-utils/integration-db";

function orderInput(product: { id: number; name: string; price: number; image: string }): CreateOrderInput {
  return {
    total: product.price,
    address: "Disposable integration-test address",
    items: [{
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    }],
  };
}

function requestHash(input: CreateOrderInput): string {
  return createOrderRequestHash({
    address: input.address,
    items: input.items.map(({ productId, quantity }) => ({ productId, quantity })),
  });
}

test("concurrent retries with one idempotency key create one order and reserve stock once", async (t) => {
  const fixture = await createIntegrationFixture(1);
  t.after(() => fixture.cleanup());
  const input = orderInput(fixture.product);
  const key = randomUUID();
  const hash = requestHash(input);

  const orders = await Promise.all([
    OrdersService.create(fixture.user.id, input, key, hash),
    OrdersService.create(fixture.user.id, input, key, hash),
  ]);

  assert.equal(orders[0].id, orders[1].id);
  assert.equal(await db.order.count({ where: { userId: fixture.user.id } }), 1);
  assert.equal((await db.product.findUniqueOrThrow({ where: { id: fixture.product.id } })).stock, 0);
});

test("competing orders cannot reserve the same final stock unit", async (t) => {
  const fixture = await createIntegrationFixture(1);
  t.after(() => fixture.cleanup());
  const input = orderInput(fixture.product);
  const hash = requestHash(input);

  const results = await Promise.allSettled([
    OrdersService.create(fixture.user.id, input, randomUUID(), hash),
    OrdersService.create(fixture.user.id, input, randomUUID(), hash),
  ]);

  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  assert.equal(await db.order.count({ where: { userId: fixture.user.id } }), 1);
  assert.equal((await db.product.findUniqueOrThrow({ where: { id: fixture.product.id } })).stock, 0);
});
