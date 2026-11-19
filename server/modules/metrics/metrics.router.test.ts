import assert from "node:assert/strict";
import test from "node:test";
import { Registry } from "@prometheus-io/client";
import { startHttpTestServer } from "../../test-utils/http";
import { createMetricsRouter } from "./metrics.router";

test("production metrics endpoint requires its configured bearer token", async (t) => {
  const metrics = {
    contentType: Registry.PROMETHEUS_CONTENT_TYPE,
    async render() {
      return "# HELP test_metric A test metric.\ntest_metric 1\n";
    },
  };
  const baseUrl = await startHttpTestServer(
    t,
    createMetricsRouter({ environment: "production", token: "a".repeat(32) }, metrics),
    { mountPath: "/api" },
  );

  const unauthorized = await fetch(`${baseUrl}/api/metrics`);
  assert.equal(unauthorized.status, 404);
  const authorized = await fetch(`${baseUrl}/api/metrics`, {
    headers: { authorization: `Bearer ${"a".repeat(32)}` },
  });
  assert.equal(authorized.status, 200);
  assert.match(authorized.headers.get("content-type") ?? "", /text\/plain/);
  assert.match(await authorized.text(), /test_metric 1/);
});

test("production metrics endpoint stays hidden when its token is not configured", async (t) => {
  const baseUrl = await startHttpTestServer(
    t,
    createMetricsRouter({ environment: "production" }),
    { mountPath: "/api" },
  );

  assert.equal((await fetch(`${baseUrl}/api/metrics`)).status, 404);
});
