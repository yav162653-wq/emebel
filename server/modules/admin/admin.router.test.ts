import assert from "node:assert/strict";
import test from "node:test";
import type { RequestHandler } from "express";
import { startHttpTestServer } from "../../test-utils/http";
import { NotFoundError } from "../../utils/errors";
import { AdminService } from "./admin.service";
import { createAdminRouter, type AdminRouterService } from "./admin.router";

const order = {
  id: 11,
  userId: 42,
  total: 240,
  status: "Processing",
  address: "12 Oak Street",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  user: { id: 42, username: "member", name: "Member" },
  items: [],
} satisfies Awaited<ReturnType<typeof AdminService.updateOrderStatus>>;

function createService(): { service: AdminRouterService; updatedStatuses: string[] } {
  const updatedStatuses: string[] = [];
  const service: AdminRouterService = {
    async getStats() {
      return {
        productCount: 1,
        userCount: 1,
        orderCount: 1,
        reviewCount: 0,
        totalInventoryValue: 480,
        lowStock: 1,
        outOfStock: 0,
      };
    },
    async getUsers() {
      return [];
    },
    async updateProduct() {
      throw new NotFoundError("Product");
    },
    async getAllOrders() {
      return [];
    },
    async updateOrderStatus(_id, status) {
      updatedStatuses.push(status);
      return { ...order, status };
    },
  };
  return { service, updatedStatuses };
}

const allowAdmin: RequestHandler = (_req, _res, next) => next();

test("admin routes return data and accept supported order status updates", async (t) => {
  const { service, updatedStatuses } = createService();
  const baseUrl = await startHttpTestServer(
    t,
    createAdminRouter(service, allowAdmin),
    { mountPath: "/api/admin", userId: 42 },
  );

  const users = await fetch(`${baseUrl}/api/admin/users`);
  assert.equal(users.status, 200);
  assert.deepEqual(await users.json(), []);

  const status = await fetch(`${baseUrl}/api/admin/orders/11/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "Shipped" }),
  });
  assert.equal(status.status, 200);
  assert.equal((await status.json()).status, "Shipped");
  assert.deepEqual(updatedStatuses, ["Shipped"]);
});

test("admin routes reject invalid status and product inputs before service calls", async (t) => {
  const { service, updatedStatuses } = createService();
  const baseUrl = await startHttpTestServer(
    t,
    createAdminRouter(service, allowAdmin),
    { mountPath: "/api/admin", userId: 42 },
  );

  const status = await fetch(`${baseUrl}/api/admin/orders/11/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "Pending" }),
  });
  assert.equal(status.status, 400);
  assert.deepEqual(updatedStatuses, []);

  const product = await fetch(`${baseUrl}/api/admin/products/11`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ stock: -1 }),
  });
  assert.equal(product.status, 400);
});

test("admin routes enforce the configured authorization middleware and map service errors", async (t) => {
  const { service } = createService();
  const unauthorizedUrl = await startHttpTestServer(
    t,
    createAdminRouter(service),
    { mountPath: "/api/admin" },
  );
  const unauthorized = await fetch(`${unauthorizedUrl}/api/admin/users`);
  assert.equal(unauthorized.status, 401);

  const baseUrl = await startHttpTestServer(
    t,
    createAdminRouter(service, allowAdmin),
    { mountPath: "/api/admin", userId: 42 },
  );
  const missing = await fetch(`${baseUrl}/api/admin/products/99`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ price: 99 }),
  });
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).code, "NOT_FOUND");
});
