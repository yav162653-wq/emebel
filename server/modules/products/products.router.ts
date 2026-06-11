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
  asyncHandler(async (_req, res) => {
    const products = await ProductsService.getAll();
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
