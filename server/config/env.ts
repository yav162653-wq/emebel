import { z } from "zod";

const isTestRun = process.env.NODE_ENV === "test"
  || process.env.npm_lifecycle_event === "test";
const optionalString = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);
const optionalUrl = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().url().optional(),
);

const baseSchema = z.object({
  NODE_ENV:       z.enum(["development", "production", "test"]).default("development"),
  PORT:           z.coerce.number().default(5000),
  DATABASE_URL:   z.string().min(1, "DATABASE_URL is required").default(
    isTestRun ? "postgresql://localhost/emebel_test" : undefined as never,
  ),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters").default(
    isTestRun ? "test-session-secret-at-least-16" : undefined as never,
  ),
  APP_ORIGIN:     z.string().optional(),
  LOG_LEVEL:      z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  OTEL_SERVICE_NAME: z.string().min(1).default("emebel"),
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalUrl,
  AUTH_MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  AUTH_EMAIL_FROM: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,
  TELEGRAM_CLIENT_ID: optionalString,
  TELEGRAM_CLIENT_SECRET: optionalString,
  SHOPIFY_SHOP_DOMAIN: optionalString,
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: optionalString,
  RESEND_API_KEY: optionalString,
  SEED_DEMO_DATA: z.enum(["true", "false"]).default("false"),
}).superRefine((data, ctx) => {
  if (data.SEED_DEMO_DATA === "true" && data.NODE_ENV === "production") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["SEED_DEMO_DATA"],
      message: "Demo seeding is prohibited in production",
    });
  }

  if (data.SEED_DEMO_DATA === "true" && data.NODE_ENV !== "production") {
    try {
      const databaseUrl = new URL(data.DATABASE_URL);
      const host = databaseUrl.hostname.toLowerCase();
      if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DATABASE_URL"],
          message: "Demo seeding is restricted to local databases",
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "A valid DATABASE_URL is required for demo seeding",
      });
    }
  }
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
