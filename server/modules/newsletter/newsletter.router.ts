import { Router } from "express";
import { NewsletterService } from "./newsletter.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { newsletterSubscribeSchema } from "../../../lib/api-zod/src";

const router = Router();

// POST /api/newsletter — subscribe email
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { email } = newsletterSubscribeSchema.parse(req.body);
    const result = await NewsletterService.subscribe(email);
    res.status(201).json(result);
  })
);

export default router;
