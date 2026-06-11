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

const updateItemSchema = z.object({
  quantity: z.number().int().min(0),
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

// PATCH /api/cart/:id — update quantity (0 = remove)
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const { quantity } = updateItemSchema.parse(req.body);
    const item = await CartService.updateQuantity(req.session.userId!, id, quantity);
    if (item === null) return res.sendStatus(204); // item removed
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
