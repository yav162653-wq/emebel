import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { createApplicationMetrics } from "./metrics";

test("records bounded HTTP labels, latency histograms, provider failures, and pool gauges", async (t) => {
  const metrics = createApplicationMetrics(() => ({
    application: { totalCount: 4, idleCount: 2, waitingCount: 1 },
    session: { totalCount: 2, idleCount: 1, waitingCount: 0 },
  }));
  const app = express();
  app.use(metrics.middleware);
  app.get("/api/products/:productId", (_req, res) => res.sendStatus(200));

  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const response = await fetch(`http://127.0.0.1:${address.port}/api/products/12345`);
  assert.equal(response.status, 200);
  metrics.recordProviderFailure("shopify", "SHOPIFY_NETWORK_ERROR");
  const output = await metrics.render();

  assert.match(output, /http_requests_total\{method="GET",route="\/api\/products\/:productId",status_code="200"\} 1/);
  assert.match(output, /http_request_duration_seconds_count\{method="GET",route="\/api\/products\/:productId",status_code="200"\} 1/);
  assert.match(output, /external_provider_failures_total\{provider="shopify",error_code="SHOPIFY_NETWORK_ERROR"\} 1/);
  assert.match(output, /database_pool_connections\{pool="application",state="waiting"\} 1/);
  assert.equal(output.includes("/api/products/12345"), false);
});
