import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { Pool } from "pg";
import { env } from "./env";
import { logger } from "./logger";
import { SESSION_IDLE_TIMEOUT_MS } from "./session-policy";

const sessionPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
});

sessionPool.on("error", (err) => {
  logger.error({ err }, "Session store database pool error");
});

const PgStore = connectPgSimple(session);

export const sessionStore = new PgStore({
  pool: sessionPool,
  tableName: "session",
  createTableIfMissing: false,
  ttl: Math.floor(SESSION_IDLE_TIMEOUT_MS / 1000),
  pruneSessionInterval: 900,
});

export async function pingSessionStore(): Promise<void> {
  await sessionPool.query("SELECT 1");
}

export async function closeSessionStore(): Promise<void> {
  await sessionPool.end();
}