import assert from "node:assert/strict";
import test from "node:test";
import type { PublicUser } from "../../../../packages/contracts/src";
import { DomainError } from "../../../../packages/kernel/src";
import type { IdentityRouterDependencies } from "./identity.router";
import { createIdentityRouter } from "./identity.router";
import { startHttpTestServer } from "../../../test-utils/http";

function publicUser(id: number): PublicUser {
  return {
    id,
    username: `member-${id}`,
    name: "Test Member",
    email: "member@example.test",
    emailVerified: false,
    role: "user",
    createdAt: "2026-01-01T00:00:00.000Z",
    workspaces: [],
  };
}

function createDependencies() {
  const calls: string[] = [];
  const identityService: IdentityRouterDependencies["identityService"] = {
    async login(username, password) {
      calls.push(`login:${username}:${password}`);
      if (password === "incorrect") {
        throw new DomainError("INVALID_CREDENTIALS", "Invalid credentials");
      }
      return publicUser(7);
    },
    async register(input) {
      calls.push(`register:${input.username}`);
      return publicUser(8);
    },
    async getById(id) {
      return id === 7 || id === 8 ? publicUser(id) : null;
    },
    async updateProfile(id) {
      return publicUser(id);
    },
    async listIdentities() {
      return [];
    },
    async requestMagicLink(email) {
      calls.push(`magic:${email}`);
    },
    async consumeMagicLink() {
      return publicUser(7);
    },
    async requestAccountLink() {},
    async consumeAccountLink() {
      return publicUser(7);
    },
  };
  const externalAuthService: IdentityRouterDependencies["externalAuthService"] = {
    availableProviders: () => [],
    async begin() {
      throw new Error("not used");
    },
    async complete() {
      return { user: publicUser(7), linked: false };
    },
    async cancel() {
      return false;
    },
  };

  return {
    calls,
    router: createIdentityRouter({
      externalAuthService,
      identityAppOrigin: "https://shop.example",
      identityService,
    }),
  };
}

function sessionCookie(response: Response): string {
  const value = response.headers.get("set-cookie");
  assert.ok(value, "expected the auth response to establish a session");
  return value.split(";", 1)[0];
}

test("register and login establish sessions, and logout invalidates them", async (t) => {
  const { router } = createDependencies();
  const baseUrl = await startHttpTestServer(t, router, { mountPath: "/api/auth" });

  const registered = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "new-member",
      password: "correct-horse-battery",
      name: "New Member",
      email: "new@example.test",
    }),
  });
  assert.equal(registered.status, 201);
  const registerCookie = sessionCookie(registered);
  const registerMe = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { cookie: registerCookie },
  });
  assert.equal(registerMe.status, 200);
  assert.equal((await registerMe.json()).id, 8);

  const loggedIn = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "member-7", password: "correct-password" }),
  });
  assert.equal(loggedIn.status, 200);
  const loginCookie = sessionCookie(loggedIn);
  const logout = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { cookie: loginCookie },
  });
  assert.equal(logout.status, 200);

  const afterLogout = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { cookie: loginCookie },
  });
  assert.equal(afterLogout.status, 401);
});

test("auth routes return expected client errors for invalid credentials and malformed bodies", async (t) => {
  const { router } = createDependencies();
  const baseUrl = await startHttpTestServer(t, router, { mountPath: "/api/auth" });

  const badCredentials = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "member-7", password: "incorrect" }),
  });
  assert.equal(badCredentials.status, 401);
  assert.equal((await badCredentials.json()).code, "INVALID_CREDENTIALS");

  const invalidRegister = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "x", password: "short", name: "" }),
  });
  assert.equal(invalidRegister.status, 400);

  const invalidLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "", password: "" }),
  });
  assert.equal(invalidLogin.status, 400);
});

test("magic-link routes validate input and keep the request response generic", async (t) => {
  const { calls, router } = createDependencies();
  const baseUrl = await startHttpTestServer(t, router, { mountPath: "/api/auth" });

  const request = await fetch(`${baseUrl}/api/auth/magic-link/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "member@example.test" }),
  });
  assert.equal(request.status, 202);
  assert.match((await request.json()).message, /If the address is eligible/);
  assert.deepEqual(calls, ["magic:member@example.test"]);

  const invalid = await fetch(`${baseUrl}/api/auth/magic-link/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  });
  assert.equal(invalid.status, 400);

  const consumed = await fetch(`${baseUrl}/api/auth/magic-link/consume`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: "0123456789abcdef0123456789abcdef" }),
  });
  assert.equal(consumed.status, 200);
  assert.equal((await consumed.json()).id, 7);
  assert.ok(sessionCookie(consumed));
});
