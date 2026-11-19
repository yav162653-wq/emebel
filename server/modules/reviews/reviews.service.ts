import { db } from "../../db/client";
import type { ReviewListQuery } from "../../../lib/api-zod/src";

export const ReviewsService = {
  async getLatest(limit = 3) {
    return db.review.findMany({
      where: { body: { not: null }, rating: { gte: 4 } },
      include: {
        user: { select: { id: true, name: true, username: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async getByProduct(productId: number, { page, pageSize }: ReviewListQuery) {
    const where = { productId };
    const [items, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.review.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async getSummary(productId: number) {
    const summary = await db.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const average = summary._avg.rating ?? 0;
    return {
      count: summary._count._all,
      average: Math.round(average * 10) / 10,
    };
  },

  async getMyReview(userId: number, productId: number) {
    return db.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
  },

  async upsert(userId: number, productId: number, rating: number, body?: string) {
    return db.review.upsert({
      where: { productId_userId: { productId, userId } },
      create: { productId, userId, rating, body },
      update: { rating, body, createdAt: new Date() },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    });
  },

  async remove(userId: number, productId: number) {
    return db.review.deleteMany({
      where: { productId, userId },
    });
  },
};
