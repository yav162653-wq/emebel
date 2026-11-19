import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "../../db/client";
import { ConflictError, NotFoundError, ValidationError } from "../../utils/errors";
import { adminOrderSelect, publicOrderSelect, userOrderListSelect } from "./orders.select";

export type CreateOrderInput = {
  total: number;
  address: string;
  items: {
    productId: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
};

export type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

export interface OrderTransaction {
  findOrderByIdempotencyKey(userId: number, idempotencyKey: string): Promise<OrderWithItems | null>;
  reserveStock(productId: number, quantity: number): Promise<boolean>;
  createOrder(
    userId: number,
    input: CreateOrderInput,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<OrderWithItems>;
  clearCart(userId: number): Promise<void>;
}

export type OrderTransactionRunner = <T>(
  operation: (transaction: OrderTransaction) => Promise<T>,
) => Promise<T>;

export type OrderRequestFingerprint = {
  address: string;
  items: { productId: number; quantity: number }[];
};

export type IdempotencyOrderFinder = (
  userId: number,
  idempotencyKey: string,
) => Promise<OrderWithItems | null>;

export function createOrderRequestHash(request: OrderRequestFingerprint): string {
  const items = request.items
    .map(({ productId, quantity }) => ({ productId, quantity }))
    .sort((left, right) => left.productId - right.productId || left.quantity - right.quantity);

  return createHash("sha256")
    .update(JSON.stringify({ address: request.address, items }))
    .digest("hex");
}

function resolveIdempotentOrder(order: OrderWithItems, requestHash: string): OrderWithItems {
  if (order.idempotencyHash !== requestHash) {
    throw new ConflictError("Idempotency key was already used for a different order");
  }
  return order;
}

export function createOrderCreator(
  runTransaction: OrderTransactionRunner,
  findCommittedOrder: IdempotencyOrderFinder,
) {
  return async (
    userId: number,
    input: CreateOrderInput,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<OrderWithItems> => {
    try {
      return await runTransaction(async (transaction) => {
        const existing = await transaction.findOrderByIdempotencyKey(userId, idempotencyKey);
        if (existing) return resolveIdempotentOrder(existing, requestHash);

        for (const item of input.items) {
          const reserved = await transaction.reserveStock(item.productId, item.quantity);
          if (!reserved) {
            throw new ValidationError(`Insufficient stock for "${item.name}"`);
          }
        }

        const order = await transaction.createOrder(userId, input, idempotencyKey, requestHash);
        await transaction.clearCart(userId);
        return order;
      });
    } catch (error) {
      const existing = await findCommittedOrder(userId, idempotencyKey);
      if (existing) return resolveIdempotentOrder(existing, requestHash);
      throw error;
    }
  };
}

const findOrderByIdempotencyKey: IdempotencyOrderFinder = (userId, idempotencyKey) =>
  db.order.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey } },
    include: { items: true },
  });

const createOrder = createOrderCreator(
  (operation) =>
    db.$transaction((tx) =>
      operation({
        findOrderByIdempotencyKey: (userId, idempotencyKey) =>
          tx.order.findUnique({
            where: { userId_idempotencyKey: { userId, idempotencyKey } },
            include: { items: true },
          }),
        reserveStock: async (productId, quantity) => {
          const result = await tx.product.updateMany({
            where: { id: productId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          return result.count === 1;
        },
        createOrder: (userId, input, idempotencyKey, requestHash) =>
          tx.order.create({
            data: {
              userId,
              total: input.total,
              address: input.address,
              idempotencyKey,
              idempotencyHash: requestHash,
              status: "Processing",
              items: {
                create: input.items.map((item) => ({
                  productId: item.productId,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  image: item.image,
                })),
              },
            },
            include: { items: true },
          }),
        clearCart: async (userId) => {
          await tx.cartItem.deleteMany({ where: { userId } });
        },
      }),
    ),
  findOrderByIdempotencyKey,
);

export const OrdersService = {
  create: createOrder,

  async findByIdempotencyKey(userId: number, idempotencyKey: string, requestHash: string) {
    const order = await findOrderByIdempotencyKey(userId, idempotencyKey);
    return order ? resolveIdempotentOrder(order, requestHash) : null;
  },

  async getByUser(userId: number) {
    return db.order.findMany({
      where: { userId },
      select: userOrderListSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(userId: number, orderId: number) {
    const order = await db.order.findFirst({
      where: { id: orderId, userId },
      select: publicOrderSelect,
    });
    if (!order) throw new NotFoundError("Order");
    return order;
  },

  async getAll() {
    return db.order.findMany({
      select: adminOrderSelect,
      orderBy: { createdAt: "desc" },
    });
  },
};
