import { db } from "../../db/client";
import { NotFoundError } from "../../utils/errors";

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

export const OrdersService = {
  async create(userId: number, input: CreateOrderInput) {
    const order = await db.order.create({
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
    });

    // Clear user's cart after order created
    await db.cartItem.deleteMany({ where: { userId } });

    return order;
  },

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
