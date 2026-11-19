import type { Prisma } from "@prisma/client";
import { db } from "../../db/client";
import { NotFoundError, ValidationError } from "../../utils/errors";

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
  reserveStock(productId: number, quantity: number): Promise<boolean>;
  createOrder(userId: number, input: CreateOrderInput): Promise<OrderWithItems>;
  clearCart(userId: number): Promise<void>;
}

export type OrderTransactionRunner = <T>(
  operation: (transaction: OrderTransaction) => Promise<T>,
) => Promise<T>;

export function createOrderCreator(runTransaction: OrderTransactionRunner) {
  return (userId: number, input: CreateOrderInput): Promise<OrderWithItems> =>
    runTransaction(async (transaction) => {
      for (const item of input.items) {
        const reserved = await transaction.reserveStock(item.productId, item.quantity);
        if (!reserved) {
          throw new ValidationError(`Insufficient stock for "${item.name}"`);
        }
      }

      const order = await transaction.createOrder(userId, input);
      await transaction.clearCart(userId);
      return order;
    });
}

const createOrder = createOrderCreator((operation) =>
  db.$transaction((tx) =>
    operation({
      reserveStock: async (productId, quantity) => {
        const result = await tx.product.updateMany({
          where: { id: productId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        return result.count === 1;
      },
      createOrder: (userId, input) =>
        tx.order.create({
          data: {
            userId,
            total: input.total,
            address: input.address,
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
);

export const OrdersService = {
  create: createOrder,

  async getByUser(userId: number) {
    return db.order.findMany({
      where: { userId },
      include: { items: { select: { id: true, name: true, price: true, quantity: true, image: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(userId: number, orderId: number) {
    const order = await db.order.findFirst({ where: { id: orderId, userId }, include: { items: true } });
    if (!order) throw new NotFoundError("Order");
    return order;
  },

  async getAll() {
    return db.order.findMany({
      include: {
        user: { select: { id: true, username: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
