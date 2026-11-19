import assert from "node:assert/strict";
import test from "node:test";
import { AdminService, ORDER_STATUSES } from "./admin.service";
import { ValidationError } from "../../utils/errors";

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
