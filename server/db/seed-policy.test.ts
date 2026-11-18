import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertSeedPolicy,
  isLocalDatabaseUrl,
  runSeedOnlyWhenAllowed,
  SeedPolicyError,
} from "./seed-policy";

test("production demo seeding is always rejected", () => {
  assert.throws(
    () => assertSeedPolicy({
      NODE_ENV: "production",
      SEED_DEMO_DATA: "true",
      DATABASE_URL: "postgresql://127.0.0.1:5432/emebel_dev",
    }),
    SeedPolicyError,
  );
  assert.throws(
    () => assertSeedPolicy({
      NODE_ENV: "production",
      SEED_DEMO_DATA: "false",
      DATABASE_URL: "postgresql://127.0.0.1:5432/emebel_dev",
    }),
    /prohibited/,
  );
});

test("development demo seeding is disabled by default", () => {
  assert.throws(
    () => assertSeedPolicy({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://localhost:5432/emebel_dev",
    }),
    /disabled/,
  );
});

test("development demo seeding requires explicit opt-in", () => {
  assert.doesNotThrow(
    () => assertSeedPolicy({
      NODE_ENV: "development",
      SEED_DEMO_DATA: "true",
      DATABASE_URL: "postgresql://localhost:5432/emebel_dev",
    }),
  );
});

test("test demo seeding requires opt-in and a local database", () => {
  assert.throws(
    () => assertSeedPolicy({
      NODE_ENV: "test",
      SEED_DEMO_DATA: "false",
      DATABASE_URL: "postgresql://localhost:5432/emebel_test",
    }),
    /disabled/,
  );
  assert.doesNotThrow(
    () => assertSeedPolicy({
      NODE_ENV: "test",
      SEED_DEMO_DATA: "true",
      DATABASE_URL: "postgresql://127.0.0.1:5432/emebel_test",
    }),
  );
});

test("contradictory remote database configuration is rejected", () => {
  assert.throws(
    () => assertSeedPolicy({
      NODE_ENV: "development",
      SEED_DEMO_DATA: "true",
      DATABASE_URL: "postgresql://db.example.com:5432/emebel",
    }),
    /local/,
  );
  assert.equal(isLocalDatabaseUrl("postgresql://db.example.com/emebel"), false);
});

test("seed action is never called before guards pass", async () => {
  let mutations = 0;

  await assert.rejects(
    runSeedOnlyWhenAllowed(
      {
        NODE_ENV: "production",
        SEED_DEMO_DATA: "true",
        DATABASE_URL: "postgresql://127.0.0.1:5432/emebel_dev",
      },
      async () => {
        mutations += 1;
      },
    ),
    SeedPolicyError,
  );

  assert.equal(mutations, 0);
});

test("fixed demo credentials are absent from seed and login source", async () => {
  const [seedSource, loginSource, adminSource] = await Promise.all([
    readFile(new URL("./seed.ts", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/pages/Auth/Login.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../client/src/pages/Admin/AdminDashboard.tsx", import.meta.url), "utf8"),
  ]);

  for (const forbidden of ["nasa_admin", "nasa_admin", "password"]) {
    assert.equal(seedSource.includes(forbidden), false);
  }
  assert.equal(loginSource.includes("nasa_admin"), false);
  assert.equal(loginSource.includes("Demo Credentials"), false);
  assert.equal(adminSource.includes("nasa_admin"), false);
});
