import assert from "node:assert/strict";
import test from "node:test";
import { apiSpec } from "../../api-spec/src";
import {
  apiErrorSchema,
  createOrderHeadersSchema,
  csrfTokenResponseSchema,
  externalIdentitySchema,
  registerSchema,
} from "./index";

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
  assert.deepEqual(
    [apiSpec.csrf.token.method, apiSpec.csrf.token.path],
    ["GET", "/api/csrf-token"],
  );
  assert.equal(csrfTokenResponseSchema.safeParse({ token: "session-token" }).success, true);
});

test("admin order response contract accepts nullable usernames", () => {
  const payload = {
    items: [{
      id: 1,
      userId: 2,
      total: 2500,
      status: "Processing",
      address: "Test address",
      createdAt: "2026-01-01T00:00:00.000Z",
      items: [],
      user: { id: 2, username: null, name: "Test Member" },
    }],
    total: 1,
    page: 1,
    pageSize: 25,
    summary: {
      orderCount: 1,
      totalRevenue: 2500,
      processingCount: 1,
      shippedCount: 0,
      deliveredCount: 0,
    },
  };

  assert.deepEqual(apiSpec.admin.orders.responses[200].parse(payload), payload);
});

test("product list contract validates cursor filters and page metadata", () => {
  assert.deepEqual(
    apiSpec.products.list.query.parse({
      cursor: "12",
      category: "Seating",
      search: "oak",
    }),
    { limit: 24, cursor: 12, category: "Seating", search: "oak" },
  );
  assert.equal(apiSpec.products.list.query.safeParse({ cursor: "0" }).success, false);
  assert.equal(apiSpec.products.list.responses[200].safeParse({
    items: [],
    total: 0,
    nextCursor: null,
  }).success, true);
});

test("admin and review list contracts coerce and bound page parameters", () => {
  assert.deepEqual(apiSpec.admin.users.query.parse({
    page: "2",
    pageSize: "10",
  }), { page: 2, pageSize: 10 });
  assert.deepEqual(apiSpec.reviews.list.query.parse({}), {
    page: 1,
    pageSize: 10,
  });
  assert.equal(apiSpec.admin.orders.query.safeParse({ pageSize: "101" }).success, false);
  assert.equal(apiSpec.reviews.list.query.safeParse({ pageSize: "51" }).success, false);
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

test("order creation contract requires a well-formed idempotency key", () => {
  const headers = { "idempotency-key": "order-request-key-2026-001" };
  assert.deepEqual(apiSpec.orders.create.headers.parse(headers), headers);
  assert.equal(createOrderHeadersSchema.safeParse({}).success, false);
  assert.equal(createOrderHeadersSchema.safeParse({
    "idempotency-key": "short",
  }).success, false);
});

test("external identity credentials accept arbitrary string keys", () => {
  const payload = {
    provider: "google",
    providerId: "provider-id",
    name: "Test Member",
    emailVerified: true,
    credentials: { accessToken: "test-token" },
  };

  assert.deepEqual(externalIdentitySchema.parse(payload), payload);
});

test("registration normalizes a blank optional email to undefined", () => {
  const parsed = registerSchema.parse({
    username: "test-member",
    password: "correct-horse-battery",
    name: "Test Member",
    email: "  ",
  });

  assert.equal(parsed.email, undefined);
});
