import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { env } from "../../config/env";
import {
  applicationMetrics,
  type MetricsEndpoint,
} from "../../config/metrics";
import { asyncHandler } from "../../utils/asyncHandler";

type MetricsAccessConfig = {
  environment: typeof env.NODE_ENV;
  token?: string;
};

function isAuthorized(authorization: string | undefined, config: MetricsAccessConfig): boolean {
  if (config.environment !== "production" && !config.token) return true;
  if (!config.token) return false;

  const provided = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!provided) return false;

  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(config.token);
  return providedBytes.length === expectedBytes.length
    && timingSafeEqual(providedBytes, expectedBytes);
}

export function createMetricsRouter(
  config: MetricsAccessConfig = {
    environment: env.NODE_ENV,
    token: env.METRICS_TOKEN,
  },
  metrics: MetricsEndpoint = applicationMetrics,
) {
  const router = Router();
  router.get(
    "/metrics",
    (req, res, next) => {
      if (!isAuthorized(req.get("authorization"), config)) {
        res.sendStatus(404);
        return;
      }
      next();
    },
    asyncHandler(async (_req, res) => {
      res.setHeader("Content-Type", metrics.contentType);
      res.send(await metrics.render());
    }),
  );
  return router;
}

export const metricsRouter = createMetricsRouter();
