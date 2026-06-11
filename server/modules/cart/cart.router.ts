import { Router } from "express";
import { z } from "zod";
import { CartService } from "./cart.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { apiLimiter } from "../../middleware/rateLimiter";

const router = Router();

const addItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

// All cart routes require auth
router.use(requireAuth);

// GET /api/cart
router.get(
  "/",
  apiLimiter,
  asyncHandler(async (req, res) => {
    const items = await CartService.getByUser(req.session.userId!);
    res.json(items);
  })
);

// POST /api/cart
router.post(
  "/",
  apiLimiter,
  asyncHandler(async (req, res) => {
    const { productId, quantity } = addItemSchema.parse(req.body);
    const item = await CartService.add(req.session.userId!, productId, quantity);
    res.json(item);
  })
);

// DELETE /api/cart/:id
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    await CartService.remove(req.session.userId!, id);
    res.sendStatus(204);
  })
);

// DELETE /api/cart (clear all)
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    await CartService.clear(req.session.userId!);
    res.sendStatus(204);
  })
);

export default router;
