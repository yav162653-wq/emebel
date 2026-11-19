import { db } from "../../db/client";
import { NotFoundError } from "../../utils/errors";
import type { ProductListQuery } from "../../../lib/api-zod/src";

export const ProductsService = {
  async getAll({ limit, cursor, category, search }: ProductListQuery) {
    const filter = {
      ...(category ? { category } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { category: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
    };
    const where = {
      ...filter,
      ...(cursor ? { id: { gt: cursor } } : {}),
    };
    const [rows, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { id: "asc" },
        take: limit + 1,
      }),
      db.product.count({ where: filter }),
    ]);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return {
      items,
      total,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  },

  async getById(id: number) {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");
    return product;
  },
};
