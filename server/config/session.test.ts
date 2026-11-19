import assert from "node:assert/strict";
import test from "node:test";
import { createSessionStoreProbe } from "./session";

test("session store readiness probe succeeds when the database query succeeds", async () => {
  let calls = 0;
  const probe = createSessionStoreProbe(async () => {
    calls += 1;
    return { rows: [{ result: 1 }] };
  });

  await probe();
  assert.equal(calls, 1);
});

test("session store readiness probe propagates database failures", async () => {
  const databaseError = new Error("session database unavailable");
  const probe = createSessionStoreProbe(async () => {
    throw databaseError;
  });

  await assert.rejects(probe(), databaseError);
});
