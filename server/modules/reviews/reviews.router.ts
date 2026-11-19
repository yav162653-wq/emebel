import { Router } from "express";
import { ReviewsService } from "./reviews.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { reviewLimiter } from "../../middleware/rateLimiter";
import {
  idParamSchema,
  latestReviewsQuerySchema,
  reviewInputSchema,
} from "../../../lib/api-zod/src";

const router = Router();

// GET /api/reviews/latest — latest top-rated reviews across all products (public)
router.get(
  "/latest",
  asyncHandler(async (req, res) => {
    const { limit } = latestReviewsQuerySchema.parse({ limit: req.query.limit });
    const reviews = await ReviewsService.getLatest(limit);
    res.json(reviews);
  })
);

// GET /api/reviews/:productId — all reviews for a product (public)
router.get(
  "/:productId",
  asyncHandler(async (req, res) => {
    const productId = idParamSchema.parse(req.params.productId);
    const reviews = await ReviewsService.getByProduct(productId);
    res.json(reviews);
  })
);

// GET /api/reviews/:productId/summary — avg rating + count (public)
router.get(
  "/:productId/summary",
  asyncHandler(async (req, res) => {
    const productId = idParamSchema.parse(req.params.productId);
    const summary = await ReviewsService.getSummary(productId);
    res.json(summary);
  })
);

// GET /api/reviews/:productId/mine — current user's own review (auth)
router.get(
  "/:productId/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = idParamSchema.parse(req.params.productId);
    const review = await ReviewsService.getMyReview(req.session.userId!, productId);
    res.json(review ?? null);
  })
);

// POST /api/reviews/:productId — create or update review (auth)
router.post(
  "/:productId",
  requireAuth,
  reviewLimiter,
  asyncHandler(async (req, res) => {
    const productId = idParamSchema.parse(req.params.productId);
    const { rating, body } = reviewInputSchema.parse(req.body);
    const review = await ReviewsService.upsert(req.session.userId!, productId, rating, body);
    res.status(201).json(review);
  })
);

// DELETE /api/reviews/:productId — remove own review (auth)
router.delete(
  "/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = idParamSchema.parse(req.params.productId);
    await ReviewsService.remove(req.session.userId!, productId);
    res.json({ ok: true });
  })
);

export default router;
