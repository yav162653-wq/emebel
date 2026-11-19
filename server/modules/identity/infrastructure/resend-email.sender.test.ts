import assert from "node:assert/strict";
import test from "node:test";
import { DomainError } from "../../../../packages/kernel/src";
import type { EmailMessage } from "../../../../packages/platform/src";
import { ResendEmailSender } from "./resend-email.sender";
import { createResendMock } from "../../../test-utils/resend-mock";

const message: EmailMessage = {
  to: "member@example.com",
  subject: "Sign in",
  text: "One-time sign-in link",
  kind: "magic_login",
  idempotencyKey: "stable-email-key",
};

test("Resend sends its HTTP request through an injected mock fetcher", async () => {
  const mock = createResendMock([{ status: 200, body: { id: "email-test-id" } }]);
  const sender = new ResendEmailSender("auth@example.com", undefined, {
    apiKey: "test-api-key",
    fetcher: mock.fetcher,
  });

  await sender.send(message);

  assert.equal(mock.requests.length, 1);
  assert.equal(mock.requests[0].url, "https://api.resend.com/emails");
  assert.deepEqual(mock.requests[0].body, {
    from: "auth@example.com",
    to: message.to,
    subject: message.subject,
    text: message.text,
  });
  const headers = new Headers(mock.requests[0].init.headers);
  assert.equal(headers.get("authorization"), "Bearer test-api-key");
  assert.equal(headers.get("idempotency-key"), message.idempotencyKey);
});

test("Resend retries transient failures with bounded exponential delays", async () => {
  let attempts = 0;
  const keys: string[] = [];
  const delays: number[] = [];
  const sender = new ResendEmailSender("auth@example.com", {
    async proxy(_connector, _path, options) {
      attempts += 1;
      keys.push(options.headers?.["Idempotency-Key"] ?? "");
      if (attempts === 1) throw new TypeError("network unavailable");
      return new Response(null, { status: attempts === 2 ? 503 : 200 });
    },
  }, {
    timeoutMs: 50,
    maxAttempts: 3,
    retryBaseDelayMs: 100,
    sleep: async (milliseconds) => {
      delays.push(milliseconds);
    },
  });

  await sender.send(message);

  assert.equal(attempts, 3);
  assert.deepEqual(keys, Array(3).fill(message.idempotencyKey));
  assert.deepEqual(delays, [100, 200]);
});

test("Resend does not retry non-transient client errors", async () => {
  let attempts = 0;
  const sender = new ResendEmailSender("auth@example.com", {
    async proxy() {
      attempts += 1;
      return new Response(null, { status: 400 });
    },
  }, { maxAttempts: 3, retryBaseDelayMs: 0 });

  await assert.rejects(
    () => sender.send(message),
    (error: unknown) => error instanceof DomainError
      && error.code === "EMAIL_DELIVERY_FAILED",
  );
  assert.equal(attempts, 1);
});

test("Resend aborts timed-out requests and returns a delivery error", async () => {
  let aborted = false;
  const sender = new ResendEmailSender("auth@example.com", {
    proxy(_connector, _path, options) {
      options.signal?.addEventListener("abort", () => {
        aborted = true;
      });
      return new Promise<Response>(() => {});
    },
  }, { timeoutMs: 5, maxAttempts: 1 });

  await assert.rejects(
    () => sender.send(message),
    (error: unknown) => error instanceof DomainError
      && error.code === "EMAIL_DELIVERY_FAILED",
  );
  assert.equal(aborted, true);
});
