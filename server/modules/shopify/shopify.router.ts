import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { orderLimiter } from "../../middleware/rateLimiter";
import { db } from "../../db/client";
import { ValidationError } from "../../utils/errors";
import { ShopifyService } from "./shopify.service";

const router = Router();

router.use(requireAuth);

const checkoutSchema = z.object({
  email: z.string().email().optional(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive().max(50),
    }),
  ).min(1).max(50),
});

// POST /api/shopify/checkout — creates a Shopify cart, never a local unpaid order
router.post(
  "/checkout",
  orderLimiter,
  asyncHandler(async (req, res) => {
    const { email, items } = checkoutSchema.parse(req.body);
    const productIds = Array.from(new Set(items.map((item) => item.productId)));
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, stock: true },
    });

    if (products.length !== productIds.length) {
      throw new ValidationError("One or more products not found");
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    const checkoutItems = items.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) {
        throw new ValidationError("One or more products not found");
      }
      return { product, quantity: item.quantity };
    });

    const checkoutUrl = await ShopifyService.createCheckoutUrl(checkoutItems, email);
    res.status(200).json({ checkoutUrl });
  }),
);

export default router;