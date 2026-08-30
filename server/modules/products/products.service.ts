import { db } from "../../db/client";
import { NotFoundError } from "../../utils/errors";

export const ProductsService = {
  async getAll(limit?: number) {
    return db.product.findMany({
      orderBy: { id: "asc" },
      ...(limit ? { take: limit } : {}),
    });
  },

  async getById(id: number) {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");
    return product;
  },
};
