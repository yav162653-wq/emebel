import type { Prisma } from "@prisma/client";

const orderScalarSelect = {
  id: true,
  userId: true,
  total: true,
  status: true,
  address: true,
  createdAt: true,
} satisfies Prisma.OrderSelect;

export const publicOrderSelect = {
  ...orderScalarSelect,
  items: {
    select: {
      id: true,
      orderId: true,
      productId: true,
      name: true,
      price: true,
      quantity: true,
      image: true,
    },
  },
} satisfies Prisma.OrderSelect;

export const userOrderListSelect = {
  ...orderScalarSelect,
  items: {
    select: {
      id: true,
      name: true,
      price: true,
      quantity: true,
      image: true,
    },
  },
} satisfies Prisma.OrderSelect;

export const adminOrderSelect = {
  ...publicOrderSelect,
  user: { select: { id: true, username: true, name: true } },
} satisfies Prisma.OrderSelect;
