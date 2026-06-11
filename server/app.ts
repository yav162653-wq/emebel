import express from "express";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";
import MemoryStore from "memorystore";

import { env } from "./config/env";
import { httpLogger } from "./config/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimiter";

import authRouter     from "./modules/auth/auth.router";
import productsRouter from "./modules/products/products.router";
import cartRouter     from "./modules/cart/cart.router";

const SessionStore = MemoryStore(session);

export function createApp() {
  const app = express();

  // ── Trust proxy (Replit sits behind a reverse proxy) ─────────────────
  app.set("trust proxy", 1);

  // ── Security ──────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false, // Disabled: frontend is on same origin via Vite
    })
  );

  app.use(
    cors({
      origin:
        env.NODE_ENV === "production"
          ? process.env.APP_ORIGIN?.split(",") || false
          : true,
      credentials: true,
    })
  );

  // ── Logging ───────────────────────────────────────────────────────────
  app.use(httpLogger);

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
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
      },
      store: new SessionStore({ checkPeriod: 86_400_000 }),
    })
  );

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
  app.use("/api/auth",     authRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/cart",     cartRouter);

  // ── 404 for unmatched API routes (frontend routes handled by Vite) ────
  app.use("/api/*", notFoundHandler);

  // ── Global Error Handler ──────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
