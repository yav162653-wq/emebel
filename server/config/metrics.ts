import { Counter, Gauge, Histogram, Registry } from "@prometheus-io/client";
import type { RequestHandler } from "express";
import { getApplicationPoolMetrics } from "../db/client";
import { getSessionPoolMetrics } from "./session";

type PoolMetrics = {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
};

type PoolMetricsProvider = () => Record<string, PoolMetrics>;
export type ExternalProvider = "shopify" | "resend";

export type MetricsEndpoint = {
  contentType: string;
  render: () => Promise<string>;
};

const requestMethods = new Set([
  "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS",
]);
const latencyBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

function readPoolMetrics(): Record<string, PoolMetrics> {
  return {
    application: getApplicationPoolMetrics(),
    session: getSessionPoolMetrics(),
  };
}

export function createApplicationMetrics(
  getPools: PoolMetricsProvider = readPoolMetrics,
) {
  const registry = new Registry();
  const requests = new Counter({
    name: "http_requests_total",
    help: "Completed HTTP requests.",
    labelNames: ["method", "route", "status_code"],
    registers: [registry],
  });
  const requestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds.",
    labelNames: ["method", "route", "status_code"],
    buckets: latencyBuckets,
    registers: [registry],
  });
  const providerFailures = new Counter({
    name: "external_provider_failures_total",
    help: "Failed external provider operations.",
    labelNames: ["provider", "error_code"],
    registers: [registry],
  });
  new Gauge({
    name: "database_pool_connections",
    help: "PostgreSQL pool connection counts by pool and state.",
    labelNames: ["pool", "state"],
    registers: [registry],
    collect() {
      this.reset();
      for (const [pool, metrics] of Object.entries(getPools())) {
        this.set({ pool, state: "total" }, metrics.totalCount);
        this.set({ pool, state: "idle" }, metrics.idleCount);
        this.set({ pool, state: "waiting" }, metrics.waitingCount);
      }
    },
  });

  const middleware: RequestHandler = (req, res, next) => {
    if (req.path === "/api/metrics") {
      next();
      return;
    }

    const startedAt = process.hrtime.bigint();
    res.once("finish", () => {
      const method = requestMethods.has(req.method) ? req.method : "OTHER";
      const routePath = typeof req.route?.path === "string" ? req.route.path : "unmatched";
      const route = `${req.baseUrl}${routePath}` || "/";
      const statusCode = String(res.statusCode);
      const labels = { method, route, status_code: statusCode };
      requests.inc(labels);
      requestDuration.observe(
        labels,
        Number(process.hrtime.bigint() - startedAt) / 1_000_000_000,
      );
    });
    next();
  };

  return {
    middleware,
    recordProviderFailure(provider: ExternalProvider, errorCode: string) {
      const safeCode = /^[A-Z][A-Z0-9_]{0,63}$/.test(errorCode)
        ? errorCode
        : "UNKNOWN";
      providerFailures.inc({ provider, error_code: safeCode });
    },
    contentType: registry.contentType,
    render: () => registry.metrics(),
  } satisfies MetricsEndpoint & {
    middleware: RequestHandler;
    recordProviderFailure: (provider: ExternalProvider, errorCode: string) => void;
  };
}

export const applicationMetrics = createApplicationMetrics();
