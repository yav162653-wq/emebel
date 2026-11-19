import { db } from "../../db/client";
import { NotFoundError, ValidationError } from "../../utils/errors";
import {
  orderStatusSchema,
  type AdminListQuery,
  type AdminOrderListQuery,
  type OrderStatus,
} from "../../../lib/api-zod/src";
import { adminOrderSelect } from "../orders/orders.select";

export const ORDER_STATUSES = orderStatusSchema.options;

type InventoryAggregate = {
  productCount: string;
  totalInventoryValue: string;
  lowStock: string;
  outOfStock: string;
};

type InventoryAggregateQuery = () => Promise<InventoryAggregate[]>;

function parseAggregateInteger(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new RangeError(`Inventory aggregate ${field} is outside the safe integer range`);
  }
  return parsed;
}

export function createInventoryAggregateReader(query: InventoryAggregateQuery) {
  return async function readInventoryAggregate() {
    const [row] = await query();
    if (!row) throw new Error("Inventory aggregate query returned no result");

    return {
      productCount: parseAggregateInteger(row.productCount, "productCount"),
      totalInventoryValue: parseAggregateInteger(row.totalInventoryValue, "totalInventoryValue"),
      lowStock: parseAggregateInteger(row.lowStock, "lowStock"),
      outOfStock: parseAggregateInteger(row.outOfStock, "outOfStock"),
    };
  };
}

const getInventoryAggregate = createInventoryAggregateReader(() =>
  db.$queryRaw<InventoryAggregate[]>`
    SELECT
      COUNT(*)::text AS "productCount",
      COALESCE(SUM(price::numeric * stock::numeric), 0)::text AS "totalInventoryValue",
      COUNT(*) FILTER (WHERE stock > 0 AND stock <= 5)::text AS "lowStock",
      COUNT(*) FILTER (WHERE stock = 0)::text AS "outOfStock"
    FROM "products"
  `,
);

function isOrderStatus(status: string): status is OrderStatus {
  return orderStatusSchema.safeParse(status).success;
}

export const AdminService = {
  async getStats() {
    const [inventory, userCount, orderCount, reviewCount] = await Promise.all([
      getInventoryAggregate(),
      db.user.count(),
      db.order.count(),
      db.review.count(),
    ]);

    return {
      productCount: inventory.productCount,
      userCount,
      orderCount,
      reviewCount,
      totalInventoryValue: inventory.totalInventoryValue,
      lowStock: inventory.lowStock,
      outOfStock: inventory.outOfStock,
    };
  },

  async getUsers({ page, pageSize }: AdminListQuery) {
    const [items, total] = await Promise.all([
      db.user.findMany({
        select: { id: true, username: true, name: true, role: true },
        orderBy: { id: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.user.count(),
    ]);

    return { items, total, page, pageSize };
  },

  async updateProduct(id: number, data: { stock?: number; price?: number }) {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");
    return db.product.update({ where: { id }, data });
  },

  async getAllOrders(query: AdminOrderListQuery) {
    const { page, pageSize, status, search } = query;
    const orderIdMatch = search?.match(/^(?:SP-)?0*(\d+)$/i);
    const orderId = orderIdMatch ? Number(orderIdMatch[1]) : undefined;
    const where = {
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { user: { is: { name: { contains: search, mode: "insensitive" as const } } } },
          { user: { is: { username: { contains: search, mode: "insensitive" as const } } } },
          ...(orderId && Number.isSafeInteger(orderId) ? [{ id: orderId }] : []),
        ],
      } : {}),
    };
    const [
      items,
      total,
      orderCount,
      revenue,
      processingCount,
      shippedCount,
      deliveredCount,
    ] =
      await Promise.all([
        db.order.findMany({
          where,
          select: adminOrderSelect,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.order.count({ where }),
        db.order.count(),
        db.order.aggregate({ _sum: { total: true } }),
        db.order.count({ where: { status: "Processing" } }),
        db.order.count({ where: { status: "Shipped" } }),
        db.order.count({ where: { status: "Delivered" } }),
      ]);

    return {
      items,
      total,
      page,
      pageSize,
      summary: {
        orderCount,
        totalRevenue: revenue._sum.total ?? 0,
        processingCount,
        shippedCount,
        deliveredCount,
      },
    };
  },

  async updateOrderStatus(id: number, status: string) {
    if (!isOrderStatus(status)) {
      throw new ValidationError("Invalid order status");
    }
    const order = await db.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError("Order");
    return db.order.update({
      where: { id },
      data: { status },
      select: adminOrderSelect,
    });
  },
};
