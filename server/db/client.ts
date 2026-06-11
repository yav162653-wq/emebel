import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logger } from "../config/logger";

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
    logger.debug(`[DB] ${e.query} — ${e.duration}ms`);
  });

  client.$on("error" as never, (e: any) => {
    logger.error("[DB] Prisma error", { message: e.message });
  });

  client.$on("warn" as never, (e: any) => {
    logger.warn("[DB] Prisma warning", { message: e.message });
  });

  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
