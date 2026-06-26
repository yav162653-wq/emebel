import { db } from "../../db/client";

export const StatsService = {
  async getPublic() {
    const [productCount, reviewCount, orderCount] = await Promise.all([
      db.product.count(),
      db.review.count(),
      db.order.count(),
    ]);
    return { productCount, reviewCount, orderCount };
  },
};
