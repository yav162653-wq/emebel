import { randomUUID } from "node:crypto";
import { db } from "../db/client";

const integrationDatabaseName = "emebel_test";
const integrationPort = "55437";

function databaseUrl(value: string | undefined, variable: string): URL {
  if (!value) throw new Error(`${variable} must target the disposable integration database`);
  try {
    return new URL(value);
  } catch {
    throw new Error(`${variable} must target the disposable integration database`);
  }
}

export function assertIntegrationDatabaseTarget(): void {
  const testUrl = databaseUrl(process.env.INTEGRATION_TEST_DATABASE_URL, "INTEGRATION_TEST_DATABASE_URL");
  if (
    !["127.0.0.1", "localhost", "::1"].includes(testUrl.hostname)
    || testUrl.port !== integrationPort
    || decodeURIComponent(testUrl.pathname.slice(1)) !== integrationDatabaseName
  ) {
    throw new Error("Integration tests are restricted to the local emebel_test database");
  }

  for (const variable of ["DATABASE_URL", "MIGRATION_DATABASE_URL"]) {
    const configuredUrl = databaseUrl(process.env[variable], variable);
    if (
      configuredUrl.hostname !== testUrl.hostname
      || configuredUrl.port !== testUrl.port
      || configuredUrl.pathname !== testUrl.pathname
    ) {
      throw new Error(`${variable} must use the disposable integration database`);
    }
  }
}

export async function createIntegrationFixture(stock = 25) {
  assertIntegrationDatabaseTarget();
  const suffix = randomUUID();
  const user = await db.user.create({
    data: { name: "Integration Test User", username: `integration-${suffix}` },
  });
  const product = await db.product.create({
    data: {
      name: `Integration Product ${suffix}`,
      description: "Disposable integration-test fixture",
      price: 2500,
      category: "integration-test",
      image: "https://example.test/integration-product.png",
      stock,
    },
  });

  return {
    user,
    product,
    async cleanup() {
      await db.order.deleteMany({ where: { userId: user.id } });
      await db.cartItem.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
      await db.product.delete({ where: { id: product.id } });
    },
  };
}

export async function assertIntegrationDatabaseConnection(): Promise<void> {
  assertIntegrationDatabaseTarget();
  const [result] = await db.$queryRaw<Array<{ name: string }>>`
    SELECT current_database() AS name
  `;
  if (result?.name !== integrationDatabaseName) {
    throw new Error("Connected database is not the disposable emebel_test database");
  }
}
