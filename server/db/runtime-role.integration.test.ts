import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "pg";
import { assertRuntimeDatabaseRole, db } from "./client";

const runtimeUrl = process.env.RUNTIME_ROLE_TEST_DATABASE_URL;
const migratorUrl = process.env.MIGRATION_ROLE_TEST_DATABASE_URL;

if (!runtimeUrl || !migratorUrl) {
  throw new Error("Set both disposable runtime and migrator test database URLs");
}

function assertDisposableConnection(connectionString: string | undefined, role: string): URL {
  assert.ok(connectionString, `${role} test connection is required`);
  const url = new URL(connectionString);
  assert.ok(["localhost", "127.0.0.1", "::1"].includes(url.hostname));
  assert.equal(url.pathname, "/emebel_test");
  assert.equal(url.port, "5435");
  assert.equal(url.username, role);
  return url;
}

test("runtime app role can perform its reviewed CRUD operations", async () => {
  assertDisposableConnection(runtimeUrl, "emebel_app");
  assert.equal(process.env.DATABASE_URL, runtimeUrl);
  assert.equal(process.env.NODE_ENV, "production");

  try {
    await assertRuntimeDatabaseRole();
    const nonce = `${process.pid}-${Date.now()}`;
    const product = await db.product.findFirstOrThrow({
      where: { name: "Role test product" },
    });
    const user = await db.user.create({
      data: { name: "Role Probe", username: `role-probe-${nonce}` },
    });
    await db.user.update({
      where: { id: user.id },
      data: { name: "Role Probe Updated" },
    });

    const cartItem = await db.cartItem.create({
      data: { userId: user.id, productId: product.id, quantity: 2 },
    });
    assert.equal((await db.cartItem.findUnique({ where: { id: cartItem.id } }))?.quantity, 2);
    await db.cartItem.delete({ where: { id: cartItem.id } });

    const dbSession = await db.session.create({
      data: {
        sid: `role-probe-${nonce}`,
        sess: {},
        expire: new Date(Date.now() + 60_000),
      },
    });
    await db.session.update({
      where: { sid: dbSession.sid },
      data: { expire: new Date(Date.now() + 120_000) },
    });
    assert.ok(await db.session.findUnique({ where: { sid: dbSession.sid } }));
    await db.session.delete({ where: { sid: dbSession.sid } });

    await db.product.update({
      where: { id: product.id },
      data: { stock: { decrement: 1 } },
    });
    const order = await db.order.create({
      data: {
        userId: user.id,
        total: product.price,
        address: "Disposable role test",
        idempotencyKey: `role-probe-${nonce}`,
        idempotencyHash: "a".repeat(64),
        items: {
          create: [{
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image,
          }],
        },
      },
      include: { items: true },
    });
    assert.equal(order.items.length, 1);
  } finally {
    await db.$disconnect();
  }
});

test("runtime app role cannot perform DDL or access the migration journal", async () => {
  try {
    await assert.rejects(
      db.$executeRawUnsafe("CREATE TABLE public.runtime_role_forbidden_probe (id integer)"),
      /permission denied/i,
    );
    await assert.rejects(
      db.$queryRawUnsafe("SELECT migration_name FROM public._prisma_migrations"),
      /permission denied/i,
    );
    await assert.rejects(
      db.$executeRawUnsafe(
        "INSERT INTO public.products (name, description, price, category, image) VALUES ('Forbidden', '', 1, 'test', '')",
      ),
      /permission denied/i,
    );
  } finally {
    await db.$disconnect();
  }
});

test("migrator role can execute schema DDL", async () => {
  const url = assertDisposableConnection(migratorUrl, "emebel_migrator");
  const client = new Client({ connectionString: url.toString() });
  const probeName = `role_migration_probe_${process.pid}`;

  await client.connect();
  try {
    await client.query(`CREATE TABLE public.${probeName} (id integer PRIMARY KEY)`);
    await client.query(`DROP TABLE public.${probeName}`);
  } finally {
    await client.end();
  }
});
