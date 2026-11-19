import assert from "node:assert/strict";
import test from "node:test";
import { Writable } from "node:stream";
import { createLogger, sanitizeRequestUrl } from "./logger";

test("logger redacts nested credentials and security headers", () => {
  const chunks: string[] = [];
  const destination = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  const logger = createLogger(destination);

  logger.info({
    body: {
      password: "password-canary-value",
      clientSecret: "client-secret-canary-value",
    },
    credentials: { apiKey: "api-key-canary-value" },
    req: { headers: { "x-csrf-token": "csrf-canary-value" } },
  });

  const output = chunks.join("");
  for (const secret of [
    "password-canary-value",
    "client-secret-canary-value",
    "api-key-canary-value",
    "csrf-canary-value",
  ]) {
    assert.equal(output.includes(secret), false);
  }
  assert.equal(output.includes("[REDACTED]"), true);
});

test("request URL serializer preserves ordinary query parameters and redacts secrets", () => {
  const url = sanitizeRequestUrl(
    "/catalog?page=2&token=query-token-canary&access_token=access-canary",
  );
  const params = new URLSearchParams(url.split("?")[1]);

  assert.equal(url.startsWith("/catalog?"), true);
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("token"), "[REDACTED]");
  assert.equal(params.get("access_token"), "[REDACTED]");
  assert.equal(url.includes("canary"), false);
});
