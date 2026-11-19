import { db } from "../../db/client";

type WishlistCreateManyInput = {
  data: { userId: number; productId: number }[];
  skipDuplicates: true;
};

export function createWishlistSynchronizer(
  findProducts: (productIds: number[]) => Promise<{ id: number }[]>,
  createMany: (input: WishlistCreateManyInput) => Promise<unknown>,
) {
  return async (userId: number, productIds: number[]): Promise<void> => {
    if (productIds.length === 0) return;
    const products = await findProducts(productIds);
    if (products.length === 0) return;

    await createMany({
      data: products.map(({ id }) => ({ userId, productId: id })),
      skipDuplicates: true,
    });
  };
}

const syncWishlist = createWishlistSynchronizer(
  (productIds) => db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  }),
  (input) => db.wishlist.createMany(input),
);

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
  sync: syncWishlist,
};
