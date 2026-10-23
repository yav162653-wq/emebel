import express from "express";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { sessionStore } from "./config/session";
import { requestIdMiddleware } from "./middleware/requestId";
import { authContextMiddleware } from "./middleware/authContext";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimiter";
import { ForbiddenError } from "./utils/errors";

import authRouter       from "./modules/identity/presentation/identity.router";
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

  // ── Trust proxy (Replit sits behind a reverse proxy) ──────────────────
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // ── Request ID (must come first) ──────────────────────────────────────
  app.use(requestIdMiddleware);

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

  // ── Session ───────────────────────────────────────────────────────────
  app.use(
    session({
      secret:           env.SESSION_SECRET,
      resave:           false,
      saveUninitialized: false,
      cookie: {
        maxAge:   24 * 60 * 60 * 1000,
        httpOnly: true,
        secure:   isProd,
        sameSite: "lax",
      },
       store: sessionStore,
    })
  );

  // ── Auth context (populate res.locals.userId) ─────────────────────────
  app.use(authContextMiddleware);

  // ── HTTP request logging ──────────────────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          const requestUrl = typeof req.url === "string" ? req.url : "/";
          const path = requestUrl.split("?", 1)[0];
          const isExternalAuthCallback =
            /^\/api\/auth\/external\/(google|github|telegram)\/callback$/.test(path);
          return {
            id: req.id,
            method: req.method,
            url: isExternalAuthCallback ? path : requestUrl,
            ...(isExternalAuthCallback ? { query: "[REDACTED]" } : {}),
            headers: {
              host: req.headers?.host,
              "user-agent": req.headers?.["user-agent"],
              "content-type": req.headers?.["content-type"],
            },
            remoteAddress: req.socket?.remoteAddress,
            remotePort: req.socket?.remotePort,
          };
        },
      },
      customProps: (_req, res) => ({
        requestId: res.locals["requestId"],
        userId:    res.locals["userId"] ?? undefined,
      }),
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

  // ── Rate Limiting ─────────────────────────────────────────────────────
  app.use("/api", globalLimiter);

  // ── Health Check ──────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", env: env.NODE_ENV, timestamp: new Date().toISOString() });
  });

  // ── API Routes ────────────────────────────────────────────────────────
  app.use("/api/auth",       authRouter);
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
