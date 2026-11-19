import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { Writable } from "node:stream";
import express from "express";
import session from "express-session";
import test, { type TestContext } from "node:test";
import type { ExternalIdentityProfile, PublicUser } from "../../../../packages/contracts/src";
import type {
  ExternalAuthProvider,
  ExternalAuthProviderName,
  ExternalAuthTransactionStore,
} from "../domain/external-auth";
import { CryptoOneTimeTokenService } from "../infrastructure/crypto-token.service";
import { HmacOAuthProofFactory } from "../infrastructure/crypto-oauth-proof";
import { ExternalAuthService } from "../application/external-auth.service";
import { createHttpRequestLogger, createLogger } from "../../../config/logger";
import {
  createIdentityRouter,
  type IdentityRouterDependencies,
} from "./identity.router";

const OAUTH_CODE = "sensitive-provider-code-value";

class MemoryTransactionStore implements ExternalAuthTransactionStore {
  private readonly rows = new Map<
    string,
    {
      provider: ExternalAuthProviderName;
      userId: number | null;
      expiresAt: Date;
      consumed: boolean;
    }
  >();

  async create(input: {
    provider: ExternalAuthProviderName;
    stateHash: string;
    userId: number | null;
    expiresAt: Date;
  }) {
    this.rows.set(input.stateHash, {
      provider: input.provider,
      userId: input.userId,
      expiresAt: input.expiresAt,
      consumed: false,
    });
  }

  async consume(input: {
    provider: ExternalAuthProviderName;
    stateHash: string;
    now: Date;
  }) {
    const row = this.rows.get(input.stateHash);
    if (!row || row.provider !== input.provider || row.consumed || row.expiresAt <= input.now) {
      return null;
    }
    row.consumed = true;
    return { userId: row.userId };
  }
}

class FakeGoogleProvider implements ExternalAuthProvider {
  readonly provider = "google" as const;
  readonly redirectUri = "https://app.example/api/auth/external/google/callback";
  readonly authenticatedCodes: string[] = [];

  isConfigured() {
    return true;
  }

  async authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }) {
    const url = new URL("https://accounts.example/authorize");
    url.searchParams.set("state", input.state);
    url.searchParams.set("nonce", input.nonce);
    url.searchParams.set("code_challenge", input.codeChallenge);
    return url.toString();
  }

  async authenticate(input: { code: string; codeVerifier: string; nonce: string }) {
    this.authenticatedCodes.push(input.code);
    assert.equal(input.codeVerifier.length, 43);
    assert.equal(input.nonce.length, 43);
    return {
      provider: "google",
      providerId: "test-google-user",
      name: "Test Member",
      email: "member@example.test",
      emailVerified: true,
    } satisfies ExternalIdentityProfile;
  }
}

function publicUser(id: number): PublicUser {
  return {
    id,
    username: null,
    name: "Test Member",
    email: "member@example.test",
    emailVerified: true,
    role: "user",
    createdAt: "2026-01-01T00:00:00.000Z",
    workspaces: [],
  };
}

interface HttpHarness {
  advanceClockBy: (milliseconds: number) => void;
  baseUrl: string;
  logs: () => string;
  provider: FakeGoogleProvider;
  server: Server;
}

async function createHarness(t: TestContext, transactionTtlMs = 10 * 60 * 1000): Promise<HttpHarness> {
  let now = new Date("2026-01-01T00:00:00.000Z");
  const provider = new FakeGoogleProvider();
  const externalAuthService = new ExternalAuthService({
    providers: [provider],
    transactions: new MemoryTransactionStore(),
    tokenService: new CryptoOneTimeTokenService(),
    proofFactory: new HmacOAuthProofFactory("test-session-secret-that-is-long-enough"),
    identity: {
      async signInExternal() {
        return publicUser(7);
      },
      async linkExternal(userId) {
        return publicUser(userId);
      },
    },
    transactionTtlMs,
    clock: { now: () => now },
  });

  const identityService = {
    async getById(id: number) {
      return id === 7 || id === 99 ? publicUser(id) : null;
    },
  } as IdentityRouterDependencies["identityService"];

  let logOutput = "";
  const logDestination = new Writable({
    write(chunk, _encoding, callback) {
      logOutput += chunk.toString();
      callback();
    },
  });
  const requestLogger = createLogger(logDestination);

  const app = express();
  app.use(
    session({
      secret: "test-express-session-secret-long-enough",
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax" },
    }),
  );
  app.use(createHttpRequestLogger(requestLogger));
  app.get("/__test/session/start", (req, res) => {
    req.session.userId = 99;
    req.session.save((error) => {
      if (error) return res.sendStatus(500);
      res.sendStatus(204);
    });
  });
  app.get("/__test/session/current", (req, res) => {
    res.json({ userId: req.session.userId ?? null });
  });
  app.use(
    "/api/auth",
    createIdentityRouter({
      externalAuthService,
      identityAppOrigin: "https://shop.example",
      identityService,
    }),
  );

  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    advanceClockBy(milliseconds) {
      now = new Date(now.getTime() + milliseconds);
    },
    logs: () => logOutput,
    provider,
    server,
  };
}

function sessionCookie(response: Response): string {
  const value = response.headers.get("set-cookie");
  assert.ok(value, "expected an express-session cookie");
  return value.split(";", 1)[0];
}

async function startLogin(baseUrl: string, cookie?: string) {
  const response = await fetch(`${baseUrl}/api/auth/external/google`, {
    headers: cookie ? { cookie } : undefined,
    redirect: "manual",
  });
  assert.equal(response.status, 302);
  const location = response.headers.get("location");
  assert.ok(location);
  const authorizationUrl = new URL(location);
  const state = authorizationUrl.searchParams.get("state");
  assert.ok(state);
  const boundCookie = response.headers.get("set-cookie") ? sessionCookie(response) : cookie;
  assert.ok(boundCookie, "OAuth initiation must bind state to a browser session");
  return { authorizationLocation: location, cookie: boundCookie, state };
}

test("HTTP OAuth callback signs in, rotates the session, and redacts secrets from logs", async (t) => {
  const harness = await createHarness(t);
  const initialSession = await fetch(`${harness.baseUrl}/__test/session/start`);
  const oldCookie = sessionCookie(initialSession);
  const { authorizationLocation, cookie, state } = await startLogin(harness.baseUrl, oldCookie);

  const callback = await fetch(
    `${harness.baseUrl}/api/auth/external/google/callback?code=${encodeURIComponent(OAUTH_CODE)}&state=${encodeURIComponent(state)}`,
    { headers: { cookie }, redirect: "manual" },
  );
  assert.equal(callback.status, 302);
  assert.equal(callback.headers.get("location"), "https://shop.example/shop");
  assert.equal(callback.headers.get("cache-control"), "no-store, max-age=0");
  assert.deepEqual(harness.provider.authenticatedCodes, [OAUTH_CODE]);

  const newCookie = sessionCookie(callback);
  assert.notEqual(newCookie, oldCookie, "successful OAuth must replace the pre-authentication session");
  const currentSession = await fetch(`${harness.baseUrl}/__test/session/current`, {
    headers: { cookie: newCookie },
  });
  assert.deepEqual(await currentSession.json(), { userId: 7 });

  const callbackLocation = callback.headers.get("location")!;
  const logOutput = harness.logs();
  for (const secret of [state, OAUTH_CODE, authorizationLocation, callbackLocation]) {
    assert.equal(logOutput.includes(secret), false, "sensitive OAuth and redirect values must not be logged");
  }
  assert.match(logOutput, /"\[REDACTED\]"/);
});

test("HTTP OAuth callback safely redirects a provider denial", async (t) => {
  const harness = await createHarness(t);
  const { cookie, state } = await startLogin(harness.baseUrl);

  const response = await fetch(
    `${harness.baseUrl}/api/auth/external/google/callback?error=access_denied&state=${encodeURIComponent(state)}`,
    { headers: { cookie }, redirect: "manual" },
  );

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://shop.example/login?auth_error=cancelled");
});

test("HTTP OAuth callback safely redirects expired and replayed state errors", async (t) => {
  const harness = await createHarness(t, 1_000);
  const expired = await startLogin(harness.baseUrl);
  harness.advanceClockBy(1_001);
  const expiredResponse = await fetch(
    `${harness.baseUrl}/api/auth/external/google/callback?code=${encodeURIComponent(OAUTH_CODE)}&state=${encodeURIComponent(expired.state)}`,
    { headers: { cookie: expired.cookie }, redirect: "manual" },
  );
  assert.equal(expiredResponse.status, 302);
  assert.equal(expiredResponse.headers.get("location"), "https://shop.example/login?auth_error=provider_failed");
  assert.equal(harness.provider.authenticatedCodes.length, 0);

  const fresh = await startLogin(harness.baseUrl);
  const firstCallback = await fetch(
    `${harness.baseUrl}/api/auth/external/google/callback?code=${encodeURIComponent(OAUTH_CODE)}&state=${encodeURIComponent(fresh.state)}`,
    { headers: { cookie: fresh.cookie }, redirect: "manual" },
  );
  assert.equal(firstCallback.status, 302);
  assert.equal(firstCallback.headers.get("location"), "https://shop.example/shop");

  const replay = await fetch(
    `${harness.baseUrl}/api/auth/external/google/callback?code=${encodeURIComponent(OAUTH_CODE)}&state=${encodeURIComponent(fresh.state)}`,
    { headers: { cookie: fresh.cookie }, redirect: "manual" },
  );
  assert.equal(replay.status, 302);
  assert.equal(replay.headers.get("location"), "https://shop.example/login?auth_error=provider_failed");
  assert.equal(harness.provider.authenticatedCodes.length, 1);
});

test("HTTP OAuth callback rejects state initiated in another browser session", async (t) => {
  const harness = await createHarness(t);
  const victimSession = await fetch(`${harness.baseUrl}/__test/session/start`);
  const victimCookie = sessionCookie(victimSession);
  const attackerLogin = await startLogin(harness.baseUrl);

  const callback = await fetch(
    `${harness.baseUrl}/api/auth/external/google/callback?code=${encodeURIComponent(OAUTH_CODE)}&state=${encodeURIComponent(attackerLogin.state)}`,
    { headers: { cookie: victimCookie }, redirect: "manual" },
  );

  assert.equal(callback.status, 302);
  assert.equal(callback.headers.get("location"), "https://shop.example/account?auth_error=provider_failed");
  assert.deepEqual(harness.provider.authenticatedCodes, []);
  assert.equal(harness.logs().includes(OAUTH_CODE), false);
  assert.equal(harness.logs().includes(attackerLogin.state), false);
  const currentSession = await fetch(`${harness.baseUrl}/__test/session/current`, {
    headers: { cookie: victimCookie },
  });
  assert.deepEqual(await currentSession.json(), { userId: 99 });
});
