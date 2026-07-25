import { Router } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { authLimiter } from "../../middleware/rateLimiter";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  name:     z.string().min(1).max(100),
  email:    z.string().email().optional(),
});

// ── Local auth ────────────────────────────────────────────────────────────

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

// POST /api/auth/logout
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const requestId: string = res.locals["requestId"] ?? "unknown";
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed", code: "INTERNAL_ERROR", requestId });
      }
      res.clearCookie("connect.sid");
      res.sendStatus(200);
    });
  })
);

// ── Session / profile ─────────────────────────────────────────────────────

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await AuthService.getById(req.session.userId!);
    if (!user) {
      const requestId: string = res.locals["requestId"] ?? "unknown";
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Session expired", code: "UNAUTHORIZED", requestId });
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
      .object({
        name:  z.string().min(1).max(100).optional(),
        email: z.string().email().optional(),
      })
      .parse(req.body);
    const user = await AuthService.updateProfile(req.session.userId!, data);
    res.json(user);
  })
);

// GET /api/auth/identities — linked OAuth providers for the logged-in user
router.get(
  "/identities",
  requireAuth,
  asyncHandler(async (req, res) => {
    const identities = await AuthService.getIdentities(req.session.userId!);
    res.json(identities);
  })
);

// ── OAuth stubs (wired up when strategy credentials are configured) ────────
//
// GET /api/auth/google          → passport.authenticate('google', { scope: ['profile','email'] })
// GET /api/auth/google/callback → passport.authenticate('google', { failureRedirect: '/login' })
// GET /api/auth/telegram/callback
// GET /api/auth/github          → passport.authenticate('github', { scope: ['user:email'] })
// GET /api/auth/github/callback

export default router;
