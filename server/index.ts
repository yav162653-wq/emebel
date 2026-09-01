import "./config/env"; // Validate env first — exits on invalid config
import "./config/telemetry";
import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { db } from "./db/client";
import { closeSessionStore } from "./config/session";
import { shutdownTelemetry } from "./config/telemetry";

async function bootstrap() {
  const app = createApp();
  const httpServer = createServer(app);

  // ── Vite dev server or static production files ────────────────────────
  if (env.NODE_ENV === "production") {
    const { serveStatic } = await import("./static");
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ── Start listening ───────────────────────────────────────────────────
  httpServer.listen({ port: env.PORT, host: "0.0.0.0", reusePort: true }, () => {
    logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    await db.$disconnect();
    await closeSessionStore();
    await shutdownTelemetry();
    httpServer.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason: String(reason) }, "Unhandled rejection");
  });

  process.on("uncaughtException", (err) => {
    logger.error({ message: err.message, stack: err.stack }, "Uncaught exception");
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal bootstrap error:", err);
  process.exit(1);
});
