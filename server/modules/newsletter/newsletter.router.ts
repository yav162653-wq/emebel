import { Router } from "express";
import { z } from "zod";
import { NewsletterService } from "./newsletter.service";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email("Valid email required"),
});

// POST /api/newsletter — subscribe email
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { email } = subscribeSchema.parse(req.body);
    const result = await NewsletterService.subscribe(email);
    res.status(201).json(result);
  })
);

export default router;
