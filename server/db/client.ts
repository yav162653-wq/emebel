import "dotenv/config";
import { createRequire } from "node:module";
import type { Prisma, PrismaClient as PrismaClientType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logger } from "../config/logger";

const require = createRequire(process.cwd() + "/package.json");
const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new (options: {
    adapter: PrismaPg;
    log: Array<{ emit: "event"; level: "query" | "error" | "warn" }>;
  }) => PrismaClientType;
};

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

  client.$on("query" as never, (e: Prisma.QueryEvent) => {
    dbLogger.debug({ query: e.query, durationMs: e.duration }, "prisma query");
  });

  client.$on("error" as never, (e: Prisma.LogEvent) => {
    dbLogger.error({ msg: e.message }, "prisma error");
  });

  client.$on("warn" as never, (e: Prisma.LogEvent) => {
    dbLogger.warn({ msg: e.message }, "prisma warning");
  });

  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
