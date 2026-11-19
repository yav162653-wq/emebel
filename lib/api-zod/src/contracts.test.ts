import assert from "node:assert/strict";
import test from "node:test";
import { apiSpec } from "../../api-spec/src";
import { apiErrorSchema } from "./index";

test("API error contract matches the server error handler payload", () => {
  const parsed = apiErrorSchema.safeParse({
    error: "Validation failed",
    code: "VALIDATION_ERROR",
    requestId: "request-123",
    errors: [{ field: "email", message: "Invalid email" }],
  });

  assert.equal(parsed.success, true);
  assert.equal(apiErrorSchema.safeParse({ message: "Invalid email" }).success, false);
});

test("API spec includes the health check and clear-cart route", () => {
  assert.deepEqual(
    [apiSpec.health.get.method, apiSpec.health.get.path],
    ["GET", "/api/health"],
  );
  assert.deepEqual(
    [apiSpec.cart.clear.method, apiSpec.cart.clear.path],
    ["DELETE", "/api/cart"],
  );
});

test("admin order response contract accepts nullable usernames", () => {
  const payload = [{
    id: 1,
    userId: 2,
    total: 2500,
    status: "Processing",
    address: "Test address",
    createdAt: "2026-01-01T00:00:00.000Z",
    items: [],
    user: { id: 2, username: null, name: "Test Member" },
  }];

  assert.deepEqual(apiSpec.admin.orders.responses[200].parse(payload), payload);
});

test("customer order list contract matches its selected item fields", () => {
  const payload = [{
    id: 1,
    userId: 2,
    total: 2500,
    status: "Processing",
    address: "Test address",
    createdAt: "2026-01-01T00:00:00.000Z",
    items: [{ id: 3, name: "Chair", price: 2500, quantity: 1, image: "/chair.jpg" }],
  }];

  assert.deepEqual(apiSpec.orders.list.responses[200].parse(payload), payload);
});

test("latest-review query contract coerces and caps the requested limit", () => {
  assert.deepEqual(apiSpec.reviews.latest.query.parse({ limit: "99" }), { limit: 10 });
  assert.equal(apiSpec.reviews.latest.query.safeParse({ limit: "0" }).success, false);
});
