import rateLimit from "express-rate-limit";

const tooManyRequests = { error: "Too many requests, please try again later.", code: "RATE_LIMITED" };

/** Applied to all /api routes: 300 requests per 15 minutes per IP */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
  skip: (req) => req.path.startsWith("/__"),
});

/** Auth routes: 15 attempts per 15 minutes per IP (skips successful) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again in 15 minutes.", code: "AUTH_RATE_LIMITED" },
  skipSuccessfulRequests: true,
});

/** General API data routes: 150 requests per 15 minutes per IP */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});

/** Admin routes: 30 requests per 15 minutes per IP */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests. Try again in 15 minutes.", code: "ADMIN_RATE_LIMITED" },
});

/** Order creation: 10 requests per 15 minutes per IP */
export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many order requests. Try again in 15 minutes.", code: "ORDER_RATE_LIMITED" },
});

/** Review writes: 5 requests per hour per IP */
export const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many review submissions. Try again in an hour.", code: "REVIEW_RATE_LIMITED" },
});
