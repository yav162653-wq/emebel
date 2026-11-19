import { Router } from "express";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { pingSessionStore } from "../../config/session";
import { db } from "../../db/client";

type HealthChecks = {
  checkDatabase: () => Promise<void>;
  checkSessionStore: () => Promise<void>;
  environment: string;
};

const defaultChecks: HealthChecks = {
  async checkDatabase() {
    await db.$queryRaw`SELECT 1`;
  },
  checkSessionStore: pingSessionStore,
  environment: env.NODE_ENV,
};

export function createHealthRouter(checks: HealthChecks = defaultChecks) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      env: checks.environment,
      timestamp: new Date().toISOString(),
    });
  });

  router.get("/ready", async (_req, res) => {
    const [databaseResult, sessionStoreResult] = await Promise.allSettled([
      checks.checkDatabase(),
      checks.checkSessionStore(),
    ]);
    const results = {
      database: databaseResult.status === "fulfilled" ? "ok" as const : "error" as const,
      sessionStore: sessionStoreResult.status === "fulfilled" ? "ok" as const : "error" as const,
    };
    const ready = results.database === "ok" && results.sessionStore === "ok";

    if (!ready) {
      logger.error({
        databaseErrorType: databaseResult.status === "rejected"
          ? errorType(databaseResult.reason)
          : undefined,
        sessionStoreErrorType: sessionStoreResult.status === "rejected"
          ? errorType(sessionStoreResult.reason)
          : undefined,
      }, "Readiness check failed");
    }

    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      checks: results,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

function errorType(error: unknown): string {
  return error instanceof Error ? error.name : "unknown";
}

export const healthRouter = createHealthRouter();
