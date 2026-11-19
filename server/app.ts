import express from "express";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";

import { env } from "./config/env";
import { createHttpRequestLogger } from "./config/logger";
import { applicationMetrics } from "./config/metrics";
import { sessionStore } from "./config/session";
import { SESSION_IDLE_TIMEOUT_MS } from "./config/session-policy";
import { requestIdMiddleware } from "./middleware/requestId";
import { authContextMiddleware } from "./middleware/authContext";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimiter";
import { csrfMiddleware, csrfTokenHandler } from "./middleware/csrf";
import { originValidationMiddleware } from "./middleware/origin-validation";
import { sessionLifetimeMiddleware } from "./middleware/session-lifetime";
import { ForbiddenError } from "./utils/errors";

import { createIdentityRouter } from "./modules/identity/presentation/identity.router";
import { healthRouter } from "./modules/health/health.router";
import { metricsRouter } from "./modules/metrics/metrics.router";
import {
  externalAuthService,
  identityAppOrigin,
  identityService,
} from "./modules/identity/composition";
import productsRouter   from "./modules/products/products.router";
import cartRouter       from "./modules/cart/cart.router";
import adminRouter      from "./modules/admin/admin.router";
import ordersRouter     from "./modules/orders/orders.router";
import reviewsRouter    from "./modules/reviews/reviews.router";
import statsRouter      from "./modules/stats/stats.router";
import newsletterRouter from "./modules/newsletter/newsletter.router";
import wishlistRouter   from "./modules/wishlist/wishlist.router";
import shopifyRouter    from "./modules/shopify/shopify.router";

const isProd = env.NODE_ENV === "production";

export function createApp() {
  const app = express();

  // ── Proxy configuration ───────────────────────────────────────────────
  app.set("trust proxy", isProd ? 1 : false);
  app.disable("x-powered-by");

  // ── Request ID (must come first) ──────────────────────────────────────
  app.use(requestIdMiddleware);
  app.use(applicationMetrics.middleware);

  // ── Security headers ──────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc:  isProd ? ["'self'"] : ["'self'", "'unsafe-inline'"],
           styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
           imgSrc:     ["'self'", "data:", "https://images.unsplash.com"],
           fontSrc:    ["'self'", "data:", "https://fonts.gstatic.com"],
          connectSrc: isProd ? ["'self'"] : ["'self'", "ws:", "wss:"],
          frameSrc:   ["'none'"],
          objectSrc:  ["'none'"],
        },
      },
    })
  );

  const allowedOrigins = new Set(
    (env.APP_ORIGIN ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );

  app.use(
    cors({
      origin: isProd
        ? (origin, callback) => {
            if (!origin || allowedOrigins.has(origin)) {
              callback(null, true);
            } else {
              callback(new ForbiddenError("CORS origin not allowed"));
            }
          }
        : true,
      credentials: true,
    })
  );

  // ── Body Parsing ──────────────────────────────────────────────────────
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));

  // Liveness/readiness must remain reachable when the session store is down.
  app.use("/api", healthRouter);
  app.use("/api", metricsRouter);

  // ── Session ───────────────────────────────────────────────────────────
  app.use(
    session({
      secret:           env.SESSION_SECRET,
      resave:           false,
      saveUninitialized: false,
      rolling:          true,
      cookie: {
        maxAge:   SESSION_IDLE_TIMEOUT_MS,
        httpOnly: true,
        secure:   isProd,
        sameSite: "lax",
      },
      store: sessionStore,
    })
  );

  app.use(sessionLifetimeMiddleware);

  // ── Auth context (populate res.locals.userId) ─────────────────────────
  app.use(authContextMiddleware);

  // ── HTTP request logging ──────────────────────────────────────────────
  app.use(createHttpRequestLogger());

  // ── Rate Limiting ─────────────────────────────────────────────────────
  app.use("/api", globalLimiter);

  // ── CSRF Protection ───────────────────────────────────────────────────
  app.use("/api", originValidationMiddleware(allowedOrigins));
  app.use("/api", csrfMiddleware);
  app.get("/api/csrf-token", csrfTokenHandler);

  // ── API Routes ────────────────────────────────────────────────────────
  app.use(
    "/api/auth",
    createIdentityRouter({ externalAuthService, identityAppOrigin, identityService }),
  );
  app.use("/api/products",   productsRouter);
  app.use("/api/cart",       cartRouter);
  app.use("/api/admin",      adminRouter);
  app.use("/api/orders",     ordersRouter);
  app.use("/api/reviews",    reviewsRouter);
  app.use("/api/stats",      statsRouter);
  app.use("/api/newsletter", newsletterRouter);
  app.use("/api/wishlist",   wishlistRouter);
  app.use("/api/shopify",    shopifyRouter);

  // ── 404 + error handlers ──────────────────────────────────────────────
  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  return app;
}
