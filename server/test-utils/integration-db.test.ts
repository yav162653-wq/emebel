import assert from "node:assert/strict";
import test from "node:test";
import { assertIntegrationDatabaseTarget } from "./integration-db";

const connectionVariables = [
  "INTEGRATION_TEST_DATABASE_URL",
  "DATABASE_URL",
  "MIGRATION_DATABASE_URL",
] as const;

function withDatabaseUrls(databaseName: string, operation: () => void): void {
  const previous = new Map(
    connectionVariables.map((name) => [name, process.env[name]]),
  );
  const url = `postgresql://postgres:test@127.0.0.1:55437/${databaseName}`;
  for (const name of connectionVariables) process.env[name] = url;

  try {
    operation();
  } finally {
    for (const name of connectionVariables) {
      const value = previous.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("integration database guard accepts only the disposable local database", () => {
  withDatabaseUrls("emebel_test", () => {
    assert.doesNotThrow(assertIntegrationDatabaseTarget);
  });
});

test("integration database guard rejects development database URLs", () => {
  withDatabaseUrls("emebel_dev", () => {
    assert.throws(assertIntegrationDatabaseTarget, /local emebel_test database/);
  });
});
