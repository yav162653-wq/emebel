import { db } from "../../db/client";

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

  async getByProduct(productId: number) {
    return db.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getSummary(productId: number) {
    const rows = await db.review.findMany({
      where: { productId },
      select: { rating: true },
    });
    if (rows.length === 0) return { count: 0, average: 0 };
    const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
    return { count: rows.length, average: Math.round(avg * 10) / 10 };
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
