import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { Writable } from "node:stream";
import test from "node:test";
import express from "express";
import { createHttpRequestLogger, createLogger } from "../config/logger";
import { requestIdMiddleware } from "./requestId";

test("request ID, user ID, and response duration share one structured log entry", async (t) => {
  const chunks: string[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  const requestLogger = createLogger(destination);
  const app = express();
  app.use(requestIdMiddleware);
  app.use((_req, res, next) => {
    res.locals["userId"] = 42;
    next();
  });
  app.use(createHttpRequestLogger(requestLogger));
  app.get("/orders/:id", (_req, res) => res.sendStatus(200));

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
  const response = await fetch(`http://127.0.0.1:${address.port}/orders/123`, {
    headers: { "x-request-id": "invalid-request-id" },
  });
  const requestId = response.headers.get("x-request-id");
  assert.equal(response.status, 200);
  assert.ok(requestId);
  assert.notEqual(requestId, "invalid-request-id");

  const log = JSON.parse(chunks.join("")) as {
    req: { id: string };
    requestId: string;
    userId: number;
    responseTime: number;
  };
  assert.equal(log.req.id, requestId);
  assert.equal(log.requestId, requestId);
  assert.equal(log.userId, 42);
  assert.equal(typeof log.responseTime, "number");
});
