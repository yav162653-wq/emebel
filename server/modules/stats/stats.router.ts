import { Router } from "express";
import { StatsService } from "./stats.service";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// GET /api/stats — public stats (product count, review count)
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const stats = await StatsService.getPublic();
    res.json(stats);
  })
);

export default router;
