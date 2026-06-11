import { db } from "../../db/client";
import { NotFoundError, ForbiddenError } from "../../utils/errors";

export const CartService = {
  async getByUser(userId: number) {
    return db.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { id: "asc" },
    });
  },

  async add(userId: number, productId: number, quantity = 1) {
    // Verify product exists
    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError("Product");

    // Check for existing cart item and merge
    const existing = await db.cartItem.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      return db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }

    return db.cartItem.create({
      data: { userId, productId, quantity },
    });
  },

  async updateQuantity(userId: number, id: number, quantity: number) {
    const item = await db.cartItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError("Cart item");
    if (item.userId !== userId) throw new ForbiddenError();
    if (quantity <= 0) {
      await db.cartItem.delete({ where: { id } });
      return null;
    }
    return db.cartItem.update({ where: { id }, data: { quantity } });
  },

  async remove(userId: number, id: number) {
    const item = await db.cartItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError("Cart item");
    if (item.userId !== userId) throw new ForbiddenError();
    await db.cartItem.delete({ where: { id } });
  },

  async clear(userId: number) {
    await db.cartItem.deleteMany({ where: { userId } });
  },
};
