import { db } from "../../db/client";
import { NotFoundError } from "../../utils/errors";

export const AdminService = {
  async getStats() {
    const [productCount, userCount, orderCount, products] = await Promise.all([
      db.product.count(),
      db.user.count(),
      db.order.count(),
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
};
