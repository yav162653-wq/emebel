import rateLimit, { type Options } from "express-rate-limit";
import type { Request, Response } from "express";

function rateLimitHandler(errorText: string, code: string) {
  return (_req: Request, res: Response) => {
    const requestId: string = res.locals["requestId"] ?? "unknown";
    res.status(429).json({ error: errorText, code, requestId });
  };
}

const baseOpts: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
};

/** Applied to all /api routes: 300 requests per 15 minutes per IP */
export const globalLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 300,
  handler: rateLimitHandler("Too many requests, please try again later.", "RATE_LIMITED"),
  skip: (req) => req.path.startsWith("/__"),
});

/** Auth routes: 15 attempts per 15 minutes per IP (skips successful) */
export const authLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 15,
  handler: rateLimitHandler("Too many authentication attempts. Try again in 15 minutes.", "AUTH_RATE_LIMITED"),
  skipSuccessfulRequests: true,
});

/** General API data routes: 150 requests per 15 minutes per IP */
export const apiLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 150,
  handler: rateLimitHandler("Too many requests, please try again later.", "RATE_LIMITED"),
});

/** Admin routes: 30 requests per 15 minutes per IP */
export const adminLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 30,
  handler: rateLimitHandler("Too many admin requests. Try again in 15 minutes.", "ADMIN_RATE_LIMITED"),
});

/** Order creation: 10 requests per 15 minutes per IP */
export const orderLimiter = rateLimit({
  ...baseOpts,
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: rateLimitHandler("Too many order requests. Try again in 15 minutes.", "ORDER_RATE_LIMITED"),
});

/** Review writes: 5 requests per hour per IP */
export const reviewLimiter = rateLimit({
  ...baseOpts,
  windowMs: 60 * 60 * 1000,
  max: 5,
  handler: rateLimitHandler("Too many review submissions. Try again in an hour.", "REVIEW_RATE_LIMITED"),
});
