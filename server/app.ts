import express from "express";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";
import MemoryStore from "memorystore";
import pinoHttp from "pino-http";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { requestIdMiddleware } from "./middleware/requestId";
import { authContextMiddleware } from "./middleware/authContext";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalLimiter, authLimiter } from "./middleware/rateLimiter";

import authRouter       from "./modules/auth/auth.router";
import productsRouter   from "./modules/products/products.router";
import cartRouter       from "./modules/cart/cart.router";
import adminRouter      from "./modules/admin/admin.router";
import ordersRouter     from "./modules/orders/orders.router";
import reviewsRouter    from "./modules/reviews/reviews.router";
import statsRouter      from "./modules/stats/stats.router";
import newsletterRouter from "./modules/newsletter/newsletter.router";

const SessionStore = MemoryStore(session);

export function createApp() {
  const app = express();

  // ── Trust proxy (Replit sits behind a reverse proxy) ─────────────────
  app.set("trust proxy", 1);

  // ── Request ID (must come first so all downstream middleware can use it)
  app.use(requestIdMiddleware);

  // ── Security headers ──────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc:  ["'self'", "'unsafe-inline'"],   // Vite HMR in dev
          styleSrc:   ["'self'", "'unsafe-inline'"],   // Tailwind inline styles
          imgSrc:     ["'self'", "data:", "https://images.unsplash.com"],
          fontSrc:    ["'self'", "data:"],
          connectSrc: ["'self'", "ws:", "wss:"],       // Vite WS + API
          frameSrc:   ["'none'"],
          objectSrc:  ["'none'"],
        },
      },
    })
  );

  app.use(
    cors({
      origin:
        env.NODE_ENV === "production"
          ? env.APP_ORIGIN?.split(",") || false
          : true,
      credentials: true,
    })
  );

  // ── HTTP request logging (pino-http) ──────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      customProps: (req, res) => ({
        requestId: res.locals["requestId"],
        userId:    res.locals["userId"] ?? undefined,
      }),
      // Skip health-check noise
      autoLogging: {
        ignore: (req) => req.url === "/api/health" || req.url === "/health",
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    })
  );

  // ── Body Parsing ──────────────────────────────────────────────────────
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: false }));

  // ── Session ───────────────────────────────────────────────────────────
  app.use(
    session({
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
      },
      store: new SessionStore({ checkPeriod: 86_400_000 }),
    })
  );

  // ── Auth context (populate res.locals.userId after session loads) ─────
  app.use(authContextMiddleware);

  // ── Rate Limiting (only /api/* — never block Vite/static files) ──────
  app.use("/api", globalLimiter);

  // ── Health Check ──────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // ── API Routes ────────────────────────────────────────────────────────
  app.use("/api/auth",       authLimiter,  authRouter);
  app.use("/api/products",   productsRouter);
  app.use("/api/cart",       cartRouter);
  app.use("/api/admin",      adminRouter);
  app.use("/api/orders",     ordersRouter);
  app.use("/api/reviews",    reviewsRouter);
  app.use("/api/stats",      statsRouter);
  app.use("/api/newsletter", newsletterRouter);

  // ── 404 for unmatched API routes (frontend routes handled by Vite) ────
  app.use("/api/*", notFoundHandler);

  // ── Global Error Handler ──────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
