import { Router, type NextFunction, type Request, type Response } from "express";
import { DomainError } from "../../../../packages/kernel/src";
import {
  emailSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  tokenSchema,
} from "../../../../lib/api-zod/src";
import { AppError, UnauthorizedError } from "../../../utils/errors";
import { asyncHandler } from "../../../utils/asyncHandler";
import { authLimiter } from "../../../middleware/rateLimiter";
import { requireAuth } from "../../../middleware/auth";
import { identityService } from "../composition";

function mapIdentityError(error: unknown): unknown {
  if (!(error instanceof DomainError)) return error;

  const statusByCode: Record<string, number> = {
    INVALID_CREDENTIALS: 401,
    INVALID_AUTH_TOKEN: 400,
    ACCOUNT_NOT_FOUND: 404,
    USERNAME_TAKEN: 409,
    EMAIL_IN_USE: 409,
    ACCOUNT_LINK_REQUIRES_SIGN_IN: 409,
    EMAIL_DELIVERY_NOT_CONFIGURED: 503,
    EMAIL_SENDER_NOT_CONFIGURED: 503,
    EMAIL_DELIVERY_FAILED: 503,
    UNSUPPORTED_IDENTITY_PROVIDER: 400,
    INVALID_EMAIL: 400,
    INVALID_USERNAME: 400,
  };
  return new AppError(error.message, statusByCode[error.code] ?? 400, error.code);
}

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function route(handler: Handler) {
  return asyncHandler(async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(mapIdentityError(error));
    }
  });
}

function establishSession(req: Request, userId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) return reject(regenerateError);
      req.session.userId = userId;
      req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
    });
  });
}

const router = Router();

router.post(
  "/login",
  authLimiter,
  route(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await identityService.login(input.username, input.password);
    await establishSession(req, user.id);
    res.json(user);
  }),
);

router.post(
  "/register",
  authLimiter,
  route(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const user = await identityService.register(input);
    await establishSession(req, user.id);
    res.status(201).json(user);
  }),
);

router.post(
  "/logout",
  route(async (req, res) => {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((error) => (error ? reject(error) : resolve()));
    });
    res.clearCookie("connect.sid");
    res.sendStatus(200);
  }),
);

router.get(
  "/me",
  requireAuth,
  route(async (req, res) => {
    const user = await identityService.getById(req.session.userId!);
    if (!user) {
      req.session.destroy(() => {});
      throw new UnauthorizedError("Session expired");
    }
    res.json(user);
  }),
);

router.patch(
  "/profile",
  requireAuth,
  route(async (req, res) => {
    const input = profileSchema.parse(req.body);
    const user = await identityService.updateProfile(req.session.userId!, input);
    res.json(user);
  }),
);

router.get(
  "/identities",
  requireAuth,
  route(async (req, res) => {
    res.json(await identityService.listIdentities(req.session.userId!));
  }),
);

router.post(
  "/magic-link/request",
  authLimiter,
  route(async (req, res) => {
    const { email } = emailSchema.parse(req.body);
    await identityService.requestMagicLink(email);
    // Deliberately generic to prevent account enumeration.
    res.status(202).json({ message: "If the address is eligible, a sign-in link was sent." });
  }),
);

router.post(
  "/magic-link/consume",
  authLimiter,
  route(async (req, res) => {
    const { token } = tokenSchema.parse(req.body);
    const user = await identityService.consumeMagicLink(token);
    await establishSession(req, user.id);
    res.json(user);
  }),
);

router.post(
  "/account-link/request",
  requireAuth,
  authLimiter,
  route(async (req, res) => {
    const { email } = emailSchema.parse(req.body);
    await identityService.requestAccountLink(req.session.userId!, email);
    res.status(202).json({ message: "A confirmation link was sent." });
  }),
);

router.post(
  "/account-link/consume",
  authLimiter,
  route(async (req, res) => {
    const { token } = tokenSchema.parse(req.body);
    const user = await identityService.consumeAccountLink(token);
    await establishSession(req, user.id);
    res.json(user);
  }),
);

export function createIdentityRouter(): Router {
  return router;
}

export default router;