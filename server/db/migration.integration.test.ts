import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { db } from "./client";
import { assertIntegrationDatabaseConnection } from "../test-utils/integration-db";

test("disposable PostgreSQL has every checked-in Prisma migration applied", async () => {
  await assertIntegrationDatabaseConnection();

  const migrationDirectory = fileURLToPath(new URL("../../prisma/migrations", import.meta.url));
  const expectedMigrations = readdirSync(migrationDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const appliedMigrations = await db.$queryRaw<Array<{
    migration_name: string;
    finished_at: Date | null;
    rolled_back_at: Date | null;
  }>>`
    SELECT migration_name, finished_at, rolled_back_at
    FROM public."_prisma_migrations"
  `;
  const appliedNames = new Set(
    appliedMigrations
      .filter((migration) => migration.finished_at && !migration.rolled_back_at)
      .map((migration) => migration.migration_name),
  );

  assert.deepEqual(
    expectedMigrations.filter((name) => !appliedNames.has(name)),
    [],
    "all checked-in migrations should be applied successfully",
  );
});
