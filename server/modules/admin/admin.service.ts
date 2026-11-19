import { db } from "../../db/client";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { orderStatusSchema, type OrderStatus } from "../../../lib/api-zod/src";
import { adminOrderSelect } from "../orders/orders.select";

export const ORDER_STATUSES = orderStatusSchema.options;

function isOrderStatus(status: string): status is OrderStatus {
  return orderStatusSchema.safeParse(status).success;
}

export const AdminService = {
  async getStats() {
    const [productCount, userCount, orderCount, reviewCount, products] = await Promise.all([
      db.product.count(),
      db.user.count(),
      db.order.count(),
      db.review.count(),
      db.product.findMany({ select: { price: true, stock: true } }),
    ]);

    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.price * p.stock,
      0
    );
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;

    return {
      productCount,
      userCount,
      orderCount,
      reviewCount,
      totalInventoryValue,
      lowStock,
      outOfStock,
    };
  },

  async getUsers() {
    return db.user.findMany({
      select: { id: true, username: true, name: true, role: true },
      orderBy: { id: "asc" },
    });
  },

  async updateProduct(id: number, data: { stock?: number; price?: number }) {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");
    return db.product.update({ where: { id }, data });
  },

  async getAllOrders() {
    return db.order.findMany({
      select: adminOrderSelect,
      orderBy: { createdAt: "desc" },
    });
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
