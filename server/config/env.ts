import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV:       z.enum(["development", "production", "test"]).default("development"),
  PORT:           z.coerce.number().default(5000),
  DATABASE_URL:   z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  APP_ORIGIN:     z.string().optional(),
  LOG_LEVEL:      z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  OTEL_SERVICE_NAME: z.string().min(1).default("space-furniture"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  AUTH_MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  AUTH_EMAIL_FROM: z.string().trim().min(3).optional(),
});

const parsed = baseSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

// Production-only requirement: APP_ORIGIN must be set
if (parsed.data.NODE_ENV === "production" && !parsed.data.APP_ORIGIN) {
  console.error("❌ APP_ORIGIN is required in production (comma-separated list of allowed origins)");
  process.exit(1);
}

if (parsed.data.APP_ORIGIN) {
  const invalidOrigin = parsed.data.APP_ORIGIN
    .split(",")
    .map((origin) => origin.trim())
    .find((origin) => {
      try {
        const url = new URL(origin);
        return !["http:", "https:"].includes(url.protocol)
          || url.pathname !== "/"
          || Boolean(url.search)
          || Boolean(url.hash);
      } catch {
        return true;
      }
    });

  if (invalidOrigin) {
    console.error(`❌ Invalid APP_ORIGIN value: ${invalidOrigin}`);
    process.exit(1);
  }
}

export const env = parsed.data;
export type Env = typeof env;
