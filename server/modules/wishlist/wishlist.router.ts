import { Router } from "express";
import { z } from "zod";
import { WishlistService } from "./wishlist.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// All wishlist routes require authentication
router.use(requireAuth);

// GET /api/wishlist — returns array of productIds
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const ids = await WishlistService.getIds(req.session.userId!);
    res.json(ids);
  })
);

// POST /api/wishlist/:productId — add to wishlist
router.post(
  "/:productId",
  asyncHandler(async (req, res) => {
    const productId = z.coerce.number().int().positive().parse(req.params.productId);
    await WishlistService.add(req.session.userId!, productId);
    res.sendStatus(204);
  })
);

// DELETE /api/wishlist/:productId — remove from wishlist
router.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    const productId = z.coerce.number().int().positive().parse(req.params.productId);
    await WishlistService.remove(req.session.userId!, productId);
    res.sendStatus(204);
  })
);

// DELETE /api/wishlist — clear entire wishlist
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    await WishlistService.clear(req.session.userId!);
    res.sendStatus(204);
  })
);

// POST /api/wishlist/sync — bulk merge guest localStorage items on login
router.post(
  "/sync",
  asyncHandler(async (req, res) => {
    const { productIds } = z
      .object({ productIds: z.array(z.number().int().positive()) })
      .parse(req.body);
    await WishlistService.sync(req.session.userId!, productIds);
    const ids = await WishlistService.getIds(req.session.userId!);
    res.json(ids);
  })
);

export default router;
