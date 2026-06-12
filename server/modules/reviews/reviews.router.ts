import { Router } from "express";
import { z } from "zod";
import { ReviewsService } from "./reviews.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";

const router = Router();

const reviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
});

// GET /api/reviews/:productId — all reviews for a product (public)
router.get(
  "/:productId",
  asyncHandler(async (req, res) => {
    const productId = z.coerce.number().int().positive().parse(req.params.productId);
    const reviews = await ReviewsService.getByProduct(productId);
    res.json(reviews);
  })
);

// GET /api/reviews/:productId/summary — avg rating + count (public)
router.get(
  "/:productId/summary",
  asyncHandler(async (req, res) => {
    const productId = z.coerce.number().int().positive().parse(req.params.productId);
    const summary = await ReviewsService.getSummary(productId);
    res.json(summary);
  })
);

// GET /api/reviews/:productId/mine — current user's own review (auth)
router.get(
  "/:productId/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = z.coerce.number().int().positive().parse(req.params.productId);
    const review = await ReviewsService.getMyReview(req.session.userId!, productId);
    res.json(review ?? null);
  })
);

// POST /api/reviews/:productId — create or update review (auth)
router.post(
  "/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = z.coerce.number().int().positive().parse(req.params.productId);
    const { rating, body } = reviewBody.parse(req.body);
    const review = await ReviewsService.upsert(req.session.userId!, productId, rating, body);
    res.status(201).json(review);
  })
);

// DELETE /api/reviews/:productId — remove own review (auth)
router.delete(
  "/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = z.coerce.number().int().positive().parse(req.params.productId);
    await ReviewsService.remove(req.session.userId!, productId);
    res.json({ ok: true });
  })
);

export default router;
