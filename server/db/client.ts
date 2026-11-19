import "dotenv/config";
import { createRequire } from "node:module";
import type { Prisma, PrismaClient as PrismaClientType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { logger } from "../config/logger";
import { assertLeastPrivilegeRuntimeRole } from "./runtime-role";

const require = createRequire(process.cwd() + "/package.json");
type PrismaEventClient = PrismaClientType<
  Prisma.PrismaClientOptions,
  "query" | "error" | "warn"
>;
const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new (options: {
    adapter: PrismaPg;
    log: Prisma.LogDefinition[];
  }) => PrismaEventClient;
};

const dbLogger = logger.child({ module: "db" });

export async function assertRuntimeDatabaseRole(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  const [metadata] = await db.$queryRaw<Array<{
    isExpectedRole: boolean;
    isSuperuser: boolean;
    canCreateDatabase: boolean;
    canCreateRoles: boolean;
    canReplicate: boolean;
    canBypassRowLevelSecurity: boolean;
    hasRoleMembership: boolean;
    ownsDatabase: boolean;
    ownsPublicSchema: boolean;
    ownsPublicObjects: boolean;
    canCreateSchema: boolean;
    canReadMigrationJournal: boolean;
    canInsertMigrationJournal: boolean;
    canUpdateMigrationJournal: boolean;
    canDeleteMigrationJournal: boolean;
  }>>`
    SELECT
      role.rolname = 'emebel_app' AS "isExpectedRole",
      role.rolsuper AS "isSuperuser",
      role.rolcreatedb OR has_database_privilege(current_user, current_database(), 'CREATE') AS "canCreateDatabase",
      role.rolcreaterole AS "canCreateRoles",
      role.rolreplication AS "canReplicate",
      role.rolbypassrls AS "canBypassRowLevelSecurity",
      EXISTS (
        SELECT 1
        FROM pg_roles AS granted_role
        WHERE granted_role.oid <> role.oid
          AND pg_has_role(role.oid, granted_role.oid, 'MEMBER')
      ) AS "hasRoleMembership",
      database.datdba = role.oid AS "ownsDatabase",
      public_schema.nspowner = role.oid AS "ownsPublicSchema",
      EXISTS (
        SELECT 1
        FROM pg_class AS object
        WHERE object.relnamespace = public_schema.oid
          AND object.relkind IN ('r', 'p', 'S', 'v', 'm', 'f')
          AND object.relowner = role.oid
      ) OR EXISTS (
        SELECT 1
        FROM pg_proc AS routine
        WHERE routine.pronamespace = public_schema.oid
          AND routine.proowner = role.oid
      ) OR EXISTS (
        SELECT 1
        FROM pg_type AS custom_type
        WHERE custom_type.typnamespace = public_schema.oid
          AND custom_type.typowner = role.oid
          AND custom_type.typtype <> 'p'
      ) AS "ownsPublicObjects",
      has_schema_privilege(current_user, 'public', 'CREATE') AS "canCreateSchema",
      has_table_privilege(current_user, 'public._prisma_migrations', 'SELECT') AS "canReadMigrationJournal",
      has_table_privilege(current_user, 'public._prisma_migrations', 'INSERT') AS "canInsertMigrationJournal",
      has_table_privilege(current_user, 'public._prisma_migrations', 'UPDATE') AS "canUpdateMigrationJournal",
      has_table_privilege(current_user, 'public._prisma_migrations', 'DELETE') AS "canDeleteMigrationJournal"
    FROM pg_roles AS role
    JOIN pg_database AS database ON database.datname = current_database()
    JOIN pg_namespace AS public_schema ON public_schema.nspname = 'public'
    WHERE role.rolname = current_user
  `;

  assertLeastPrivilegeRuntimeRole(metadata);
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  const log: Prisma.LogDefinition[] = process.env.NODE_ENV === "development"
    ? [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "warn" },
      ]
    : [{ emit: "event", level: "error" }];

  const client = new PrismaClient({
    adapter,
    log,
  });

  client.$on("query", (e) => {
    dbLogger.debug({ query: e.query, durationMs: e.duration }, "prisma query");
  });

  client.$on("error", (e) => {
    dbLogger.error({ msg: e.message }, "prisma error");
  });

  client.$on("warn", (e) => {
    dbLogger.warn({ msg: e.message }, "prisma warning");
  });

  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
