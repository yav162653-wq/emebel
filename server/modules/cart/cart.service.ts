import { db } from "../../db/client";
import { NotFoundError, ForbiddenError } from "../../utils/errors";

type CartItemUpsertInput = {
  userId: number;
  productId: number;
  quantity: number;
};

export function createCartItemAdder<T>(
  findProduct: (productId: number) => Promise<{ id: number } | null>,
  upsertCartItem: (input: CartItemUpsertInput) => Promise<T>,
) {
  return async (userId: number, productId: number, quantity = 1): Promise<T> => {
    const product = await findProduct(productId);
    if (!product) throw new NotFoundError("Product");
    return upsertCartItem({ userId, productId, quantity });
  };
}

const addCartItem = createCartItemAdder(
  (productId) => db.product.findUnique({
    where: { id: productId },
    select: { id: true },
  }),
  ({ userId, productId, quantity }) => db.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, quantity },
    update: { quantity: { increment: quantity } },
  }),
);

export const CartService = {
  async getByUser(userId: number) {
    return db.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { id: "asc" },
    });
  },

  add: addCartItem,

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
