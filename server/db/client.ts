import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logger } from "../config/logger";

const dbLogger = logger.child({ module: "db" });

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ]
      : [
          { emit: "event", level: "error" },
        ],
  });

  client.$on("query" as never, (e: any) => {
    dbLogger.debug({ query: e.query, durationMs: e.duration }, "prisma query");
  });

  client.$on("error" as never, (e: any) => {
    dbLogger.error({ msg: e.message }, "prisma error");
  });

  client.$on("warn" as never, (e: any) => {
    dbLogger.warn({ msg: e.message }, "prisma warning");
  });

  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
