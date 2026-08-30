import { Router } from "express";
import { z } from "zod";
import { ProductsService } from "./products.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { apiLimiter } from "../../middleware/rateLimiter";

const router = Router();

// GET /api/products
router.get(
  "/",
  apiLimiter,
  asyncHandler(async (req, res) => {
    const parsedLimit = req.query.limit === undefined
      ? undefined
      : z.coerce.number().int().positive().max(100).parse(req.query.limit);
    const products = await ProductsService.getAll(parsedLimit);
    res.json(products);
  })
);

// GET /api/products/:id
router.get(
  "/:id",
  apiLimiter,
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const product = await ProductsService.getById(id);
    res.json(product);
  })
);

export default router;
