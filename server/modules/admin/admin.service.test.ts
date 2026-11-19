import assert from "node:assert/strict";
import test from "node:test";
import {
  AdminService,
  createInventoryAggregateReader,
  ORDER_STATUSES,
} from "./admin.service";
import { ValidationError } from "../../utils/errors";

test("inventory aggregate reader returns exact database summary values", async () => {
  let queries = 0;
  const readInventoryAggregate = createInventoryAggregateReader(async () => {
    queries += 1;
    return [{
      productCount: "3",
      totalInventoryValue: "125000",
      lowStock: "1",
      outOfStock: "1",
    }];
  });

  assert.deepEqual(await readInventoryAggregate(), {
    productCount: 3,
    totalInventoryValue: 125000,
    lowStock: 1,
    outOfStock: 1,
  });
  assert.equal(queries, 1);
});

test("inventory aggregate reader rejects values that cannot be represented safely", async () => {
  const readInventoryAggregate = createInventoryAggregateReader(async () => [{
    productCount: "9007199254740992",
    totalInventoryValue: "0",
    lowStock: "0",
    outOfStock: "0",
  }]);

  await assert.rejects(() => readInventoryAggregate(), RangeError);
});

test("admin order status rejects unsupported values as a validation error", async () => {
  await assert.rejects(
    AdminService.updateOrderStatus(1, "Pending"),
    (error: unknown) =>
      error instanceof ValidationError
      && error.statusCode === 400
      && error.code === "VALIDATION_ERROR",
  );
});

test("admin order status accepts only the supported workflow states", () => {
  assert.deepEqual(ORDER_STATUSES, ["Processing", "Shipped", "Delivered"]);
});
