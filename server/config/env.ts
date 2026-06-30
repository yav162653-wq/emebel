import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV:       z.enum(["development", "production", "test"]).default("development"),
  PORT:           z.coerce.number().default(5000),
  DATABASE_URL:   z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  APP_ORIGIN:     z.string().optional(),
  LOG_LEVEL:      z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
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

export const env = parsed.data;
export type Env = typeof env;
