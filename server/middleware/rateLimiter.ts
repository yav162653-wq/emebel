import rateLimit from "express-rate-limit";

const message = { message: "Too many requests, please try again later.", code: "RATE_LIMITED" };

/** Applied to all routes: 300 requests per 15 minutes per IP */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message,
  skip: (req) => req.path.startsWith("/__"),
});

/** Stricter limiter for auth routes: 15 attempts per 15 minutes per IP */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again in 15 minutes.", code: "AUTH_RATE_LIMITED" },
  skipSuccessfulRequests: true,
});

/** API data routes: 150 requests per 15 minutes per IP */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});
