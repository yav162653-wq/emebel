import { Router } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { authLimiter } from "../../middleware/rateLimiter";
import { requireAuth } from "../../middleware/auth";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(100),
});

// POST /api/auth/login
router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);
    const user = await AuthService.login(username, password);
    req.session.userId = user.id;
    res.json(user);
  })
);

// POST /api/auth/register
router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const user = await AuthService.register(data);
    req.session.userId = user.id;
    res.status(201).json(user);
  })
);

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await AuthService.getById(req.session.userId!);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Session expired", code: "UNAUTHORIZED" });
    }
    res.json(user);
  })
);

// PATCH /api/auth/profile
router.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = z
      .object({ name: z.string().min(1).max(100).optional() })
      .parse(req.body);
    const user = await AuthService.updateProfile(req.session.userId!, data);
    res.json(user);
  })
);

// POST /api/auth/logout
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.clearCookie("connect.sid");
      res.sendStatus(200);
    });
  })
);

export default router;
