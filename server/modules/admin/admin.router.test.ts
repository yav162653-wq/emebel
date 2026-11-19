import assert from "node:assert/strict";
import test from "node:test";
import type { RequestHandler } from "express";
import { startHttpTestServer } from "../../test-utils/http";
import { NotFoundError } from "../../utils/errors";
import { AdminService } from "./admin.service";
import { createAdminRouter, type AdminRouterService } from "./admin.router";
import type { AuditEvent } from "../audit/audit.service";

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

function createService(): {
  service: AdminRouterService;
  updatedStatuses: string[];
  listQueries: unknown[];
} {
  const updatedStatuses: string[] = [];
  const listQueries: unknown[] = [];
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
    async getUsers(query) {
      listQueries.push(query);
      return { items: [], total: 0, page: query.page, pageSize: query.pageSize };
    },
    async updateProduct() {
      throw new NotFoundError("Product");
    },
    async getAllOrders(query) {
      listQueries.push(query);
      return {
        items: [],
        total: 0,
        page: query.page,
        pageSize: query.pageSize,
        summary: {
          orderCount: 0,
          totalRevenue: 0,
          processingCount: 0,
          shippedCount: 0,
          deliveredCount: 0,
        },
      };
    },
    async updateOrderStatus(_id, status) {
      updatedStatuses.push(status);
      return { ...order, status };
    },
  };
  return { service, updatedStatuses, listQueries };
}

const allowAdmin: RequestHandler = (_req, _res, next) => next();

test("admin routes return data and accept supported order status updates", async (t) => {
  const { service, updatedStatuses, listQueries } = createService();
  const baseUrl = await startHttpTestServer(
    t,
    createAdminRouter(service, allowAdmin),
    { mountPath: "/api/admin", userId: 42 },
  );

  const users = await fetch(`${baseUrl}/api/admin/users?page=2&pageSize=10`);
  assert.equal(users.status, 200);
  assert.deepEqual(await users.json(), {
    items: [],
    total: 0,
    page: 2,
    pageSize: 10,
  });

  const orders = await fetch(
    `${baseUrl}/api/admin/orders?page=3&pageSize=5&status=Shipped&search=chair`,
  );
  assert.equal(orders.status, 200);
  assert.deepEqual((await orders.json()).summary, {
    orderCount: 0,
    totalRevenue: 0,
    processingCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
  });
  assert.deepEqual(listQueries, [
    { page: 2, pageSize: 10 },
    { page: 3, pageSize: 5, status: "Shipped", search: "chair" },
  ]);

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

test("admin mutations emit audit events with actor and safe change metadata", async (t) => {
  const { service } = createService();
  service.updateProduct = async (id, data) => ({
    id,
    name: "Test chair",
    description: "Test description",
    price: data.price ?? 100,
    category: "seating",
    image: "chair.jpg",
    stock: data.stock ?? 2,
    material: "wood",
    warranty: "lifetime",
    origin: "local",
    assembly: "included",
    colors: [],
  });
  const auditEvents: AuditEvent[] = [];
  const baseUrl = await startHttpTestServer(
    t,
    createAdminRouter(service, allowAdmin, (event) => auditEvents.push(event)),
    { mountPath: "/api/admin", userId: 42 },
  );

  const productResponse = await fetch(`${baseUrl}/api/admin/products/7`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ price: 250 }),
  });
  assert.equal(productResponse.status, 200);

  const response = await fetch(`${baseUrl}/api/admin/orders/11/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "Delivered" }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(auditEvents, [{
    event: "admin.product.updated",
    actorId: 42,
    productId: 7,
    changedFields: ["price"],
  }, {
    event: "admin.order.status.updated",
    actorId: 42,
    orderId: 11,
    status: "Delivered",
  }]);
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
