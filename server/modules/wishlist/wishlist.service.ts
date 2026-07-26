import { db } from "../../db/client";

export const WishlistService = {
  /** Returns all product IDs in the user's wishlist */
  async getIds(userId: number): Promise<number[]> {
    const rows = await db.wishlist.findMany({
      where:  { userId },
      select: { productId: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => r.productId);
  },

  /** Add a product — idempotent (no error if already exists) */
  async add(userId: number, productId: number): Promise<void> {
    await db.wishlist.upsert({
      where:  { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
  },

  /** Remove a product — idempotent */
  async remove(userId: number, productId: number): Promise<void> {
    await db.wishlist.deleteMany({ where: { userId, productId } });
  },

  /** Clear entire wishlist */
  async clear(userId: number): Promise<void> {
    await db.wishlist.deleteMany({ where: { userId } });
  },

  /**
   * Bulk-sync: merge a list of productIds into the user's wishlist.
   * Used when a guest logs in and we merge their localStorage items.
   */
  async sync(userId: number, productIds: number[]): Promise<void> {
    if (productIds.length === 0) return;
    // upsert each — skip invalid product IDs silently
    const products = await db.product.findMany({
      where:  { id: { in: productIds } },
      select: { id: true },
    });
    const validIds = products.map((p) => p.id);
    for (const productId of validIds) {
      await db.wishlist.upsert({
        where:  { userId_productId: { userId, productId } },
        update: {},
        create: { userId, productId },
      });
    }
  },
};
