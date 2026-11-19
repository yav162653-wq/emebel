import { db } from "../../db/client";
import { NotFoundError, ForbiddenError } from "../../utils/errors";

type CartItemUpsertInput = {
  userId: number;
  productId: number;
  quantity: number;
};

type CartItemMutationInput = {
  id: number;
  userId: number;
};

type CartItemOwnership = {
  id: number;
  userId: number;
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

export function createCartItemMutator<T>(
  findItem: (id: number) => Promise<CartItemOwnership | null>,
  updateItem: (input: CartItemMutationInput & { quantity: number }) => Promise<T | null>,
  deleteItem: (input: CartItemMutationInput) => Promise<boolean>,
) {
  async function assertOwner(userId: number, id: number) {
    const item = await findItem(id);
    if (!item) throw new NotFoundError("Cart item");
    if (item.userId !== userId) throw new ForbiddenError();
  }

  async function remove(userId: number, id: number): Promise<void> {
    await assertOwner(userId, id);
    if (!await deleteItem({ id, userId })) throw new NotFoundError("Cart item");
  }

  async function updateQuantity(userId: number, id: number, quantity: number): Promise<T | null> {
    await assertOwner(userId, id);
    if (quantity <= 0) {
      if (!await deleteItem({ id, userId })) throw new NotFoundError("Cart item");
      return null;
    }

    const item = await updateItem({ id, userId, quantity });
    if (!item) throw new NotFoundError("Cart item");
    return item;
  }

  return { updateQuantity, remove };
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

const cartItemMutator = createCartItemMutator(
  (id) => db.cartItem.findUnique({
    where: { id },
    select: { id: true, userId: true },
  }),
  ({ id, userId, quantity }) => db.$transaction(async (tx) => {
    const result = await tx.cartItem.updateMany({
      where: { id, userId },
      data: { quantity },
    });
    if (result.count === 0) return null;
    return tx.cartItem.findUnique({ where: { id, userId } });
  }),
  async ({ id, userId }) => {
    const result = await db.cartItem.deleteMany({ where: { id, userId } });
    return result.count > 0;
  },
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

  updateQuantity: cartItemMutator.updateQuantity,

  remove: cartItemMutator.remove,

  async clear(userId: number) {
    await db.cartItem.deleteMany({ where: { userId } });
  },
};
