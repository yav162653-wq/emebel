import assert from "node:assert/strict";
import test from "node:test";
import { Router } from "express";
import { startHttpTestServer } from "../test-utils/http";
import { csrfMiddleware, csrfTokenHandler } from "./csrf";
import { originValidationMiddleware } from "./origin-validation";

function createSecurityRouter(allowedOrigins: ReadonlySet<string> = new Set()) {
  const router = Router();
  router.get("/csrf-token", csrfTokenHandler);
  router.use(originValidationMiddleware(allowedOrigins));
  router.use(csrfMiddleware);
  router.post("/mutation", (_req, res) => res.sendStatus(204));
  return router;
}

async function issueToken(baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/csrf-token`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");

  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  const payload = await response.json() as { token: string };
  assert.match(payload.token, /^[A-Za-z0-9_-]{43}$/);
  return { cookie, token: payload.token };
}

test("CSRF token permits a same-origin mutation only when echoed in the header", async (t) => {
  const baseUrl = await startHttpTestServer(t, createSecurityRouter(), {
    mountPath: "/api",
  });
  const { cookie, token } = await issueToken(baseUrl);
  const response = await fetch(`${baseUrl}/api/mutation`, {
    method: "POST",
    headers: {
      origin: baseUrl,
      cookie,
      "x-csrf-token": token,
    },
  });

  assert.equal(response.status, 204);
});

test("CSRF middleware rejects missing tokens, missing origins, and disallowed origins", async (t) => {
  const baseUrl = await startHttpTestServer(t, createSecurityRouter(), {
    mountPath: "/api",
  });
  const missingToken = await fetch(`${baseUrl}/api/mutation`, {
    method: "POST",
    headers: { origin: baseUrl },
  });
  assert.equal(missingToken.status, 403);

  const missingOrigin = await fetch(`${baseUrl}/api/mutation`, {
    method: "POST",
    headers: { "x-csrf-token": "untrusted-token" },
  });
  assert.equal(missingOrigin.status, 403);

  const { cookie, token } = await issueToken(baseUrl);
  const invalidToken = await fetch(`${baseUrl}/api/mutation`, {
    method: "POST",
    headers: {
      origin: baseUrl,
      cookie,
      "x-csrf-token": "untrusted-token",
    },
  });
  assert.equal(invalidToken.status, 403);

  const disallowedOrigin = await fetch(`${baseUrl}/api/mutation`, {
    method: "POST",
    headers: {
      origin: "https://attacker.example",
      cookie,
      "x-csrf-token": token,
    },
  });
  assert.equal(disallowedOrigin.status, 403);
});

test("origin validation accepts a same-origin Referer when Origin is absent", async (t) => {
  const baseUrl = await startHttpTestServer(t, createSecurityRouter(), {
    mountPath: "/api",
  });
  const { cookie, token } = await issueToken(baseUrl);
  const response = await fetch(`${baseUrl}/api/mutation`, {
    method: "POST",
    headers: {
      referer: `${baseUrl}/account`,
      cookie,
      "x-csrf-token": token,
    },
  });

  assert.equal(response.status, 204);
});

test("origin validation permits configured application origins", async (t) => {
  const baseUrl = await startHttpTestServer(
    t,
    createSecurityRouter(new Set(["https://store.example"])),
    { mountPath: "/api" },
  );
  const { cookie, token } = await issueToken(baseUrl);
  const response = await fetch(`${baseUrl}/api/mutation`, {
    method: "POST",
    headers: {
      origin: "https://store.example",
      cookie,
      "x-csrf-token": token,
    },
  });

  assert.equal(response.status, 204);
});
