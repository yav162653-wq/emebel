import { Router } from "express";
import { ProductsService } from "./products.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { apiLimiter } from "../../middleware/rateLimiter";
import { idParamSchema, productListQuerySchema } from "../../../lib/api-zod/src";

export type ProductsRouterService = Pick<typeof ProductsService, "getAll" | "getById">;

export function createProductsRouter(service: ProductsRouterService = ProductsService) {
  const router = Router();

  router.get(
    "/",
    apiLimiter,
    asyncHandler(async (req, res) => {
      const { limit } = productListQuerySchema.parse({ limit: req.query.limit });
      const products = await service.getAll(limit);
      res.json(products);
    })
  );

  router.get(
    "/:id",
    apiLimiter,
    asyncHandler(async (req, res) => {
      const id = idParamSchema.parse(req.params.id);
      const product = await service.getById(id);
      res.json(product);
    })
  );

  return router;
}

export default createProductsRouter();
