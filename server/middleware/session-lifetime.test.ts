import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import session from "express-session";
import { sessionLifetimeMiddleware } from "./session-lifetime";
import { SESSION_ABSOLUTE_TIMEOUT_MS } from "../config/session-policy";
import { requireAuth } from "./auth";
import { errorHandler } from "./errorHandler";

test("session absolute lifetime expires an authenticated session", async (t) => {
  const app = express();
  app.use(session({
    secret: "session-lifetime-test-secret-long-enough",
    resave: false,
    saveUninitialized: false,
  }));
  app.use(sessionLifetimeMiddleware);
  app.get("/seed-expired", (req, res, next) => {
    req.session.userId = 42;
    req.session.authenticatedAt = Date.now() - SESSION_ABSOLUTE_TIMEOUT_MS - 1;
    req.session.save((error) => error ? next(error) : res.sendStatus(204));
  });
  app.get("/private", requireAuth, (_req, res) => res.sendStatus(204));
  app.use(errorHandler);

  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const seeded = await fetch(`${baseUrl}/seed-expired`);
  assert.equal(seeded.status, 204);
  const cookie = seeded.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie);

  const response = await fetch(`${baseUrl}/private`, {
    headers: { cookie },
  });

  assert.equal(response.status, 401);
  assert.match(response.headers.get("set-cookie") ?? "", /connect\.sid=;/);
});
