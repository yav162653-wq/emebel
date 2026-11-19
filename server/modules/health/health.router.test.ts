import assert from "node:assert/strict";
import test from "node:test";
import { startHttpTestServer } from "../../test-utils/http";
import { createHealthRouter } from "./health.router";

test("liveness responds without probing database or session dependencies", async (t) => {
  let probeCalls = 0;
  const baseUrl = await startHttpTestServer(t, createHealthRouter({
    async checkDatabase() {
      probeCalls += 1;
    },
    async checkSessionStore() {
      probeCalls += 1;
    },
    environment: "test",
  }), { mountPath: "/api" });

  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "ok");
  assert.equal(probeCalls, 0);
});

test("readiness returns 200 when both dependencies respond", async (t) => {
  const baseUrl = await startHttpTestServer(t, createHealthRouter({
    async checkDatabase() {},
    async checkSessionStore() {},
    environment: "test",
  }), { mountPath: "/api" });

  const response = await fetch(`${baseUrl}/api/ready`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "ready");
  assert.deepEqual(body.checks, { database: "ok", sessionStore: "ok" });
});

test("readiness reports dependency status and returns 503 when a probe fails", async (t) => {
  const baseUrl = await startHttpTestServer(t, createHealthRouter({
    async checkDatabase() {
      throw new Error("database details must not leave the server");
    },
    async checkSessionStore() {},
    environment: "test",
  }), { mountPath: "/api" });

  const response = await fetch(`${baseUrl}/api/ready`);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.status, "not_ready");
  assert.deepEqual(body.checks, { database: "error", sessionStore: "ok" });
  assert.equal(typeof body.timestamp, "string");
});
