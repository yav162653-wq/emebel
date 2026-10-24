import assert from "node:assert/strict";
import test from "node:test";
import { DomainError } from "../../../../packages/kernel/src";
import type { ExternalIdentityProfile } from "../../../../packages/contracts/src";
import type {
  EmailMessage,
  EmailSender,
  OneTimeTokenService,
  PasswordHasher,
} from "../../../../packages/platform/src";
import { IdentityService } from "./identity.service";
import { ResendEmailSender } from "../infrastructure/resend-email.sender";
import type {
  IdentityAccount,
  IdentityRepository,
  StoredAuthToken,
  StoredIdentity,
} from "../domain/identity.repository";

class FakeRepository implements IdentityRepository {
  accounts = new Map<number, IdentityAccount>();
  identities: Array<StoredIdentity & { credentials: Record<string, unknown> }> = [];
  passwordHashes = new Map<string, string>();
  tokens: Array<StoredAuthToken & { tokenHash: string; consumedAt?: Date }> = [];
  private nextUserId = 1;
  private nextIdentityId = 1;

  seedAccount(input: {
    username?: string | null;
    name: string;
    email?: string | null;
    emailVerified?: boolean;
  }): IdentityAccount {
    const id = this.nextUserId++;
    const account = this.account({
      id,
      username: input.username ?? null,
      name: input.name,
      email: input.email ?? null,
      emailVerifiedAt: input.emailVerified ? new Date("2026-01-01T00:00:00Z") : null,
      role: "user",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      memberships: [],
    });
    this.accounts.set(id, account);
    return account;
  }

  private account(data: IdentityAccount): IdentityAccount {
    return structuredClone(data);
  }

  async findUserById(id: number) {
    const user = this.accounts.get(id);
    return user ? this.account(user) : null;
  }

  async findUserByUsername(username: string) {
    const user = [...this.accounts.values()].find((item) => item.username === username);
    return user ? this.account(user) : null;
  }

  async findUserByEmail(email: string) {
    const user = [...this.accounts.values()].find((item) => item.email === email);
    return user ? this.account(user) : null;
  }

  async findIdentity(provider: string, providerId: string) {
    const identity = this.identities.find(
      (item) => item.provider === provider && item.providerId === providerId,
    );
    return identity ? this.publicIdentity(identity) : null;
  }

  async findIdentityForUser(userId: number, provider: string) {
    const identity = this.identities.find(
      (item) => item.userId === userId && item.provider === provider,
    );
    return identity ? this.publicIdentity(identity) : null;
  }

  async findLocalPasswordHash(username: string) {
    return this.passwordHashes.get(username) ?? null;
  }

  async ensurePersonalWorkspace(userId: number) {
    const account = this.accounts.get(userId);
    if (!account || account.memberships.length > 0) return;
    account.memberships = [{
      id: `membership-${userId}`,
      organizationId: `organization-${userId}`,
      organizationName: `${account.name}'s Workspace`,
      organizationSlug: `workspace-${userId}`,
      plan: "free",
      role: "owner",
      status: "active",
    }];
  }

  async createLocalAccount(input: {
    username: string;
    name: string;
    email: string | null;
    passwordHash: string;
  }) {
    const account = this.seedAccount({
      username: input.username,
      name: input.name,
      email: input.email,
    });
    this.passwordHashes.set(input.username, input.passwordHash);
    this.identities.push({
      ...this.newIdentity(account.id, "local", input.username),
      credentials: { hash: input.passwordHash },
    });
    await this.ensurePersonalWorkspace(account.id);
    return this.account(account);
  }

  async createEmailAccount(input: { email: string }) {
    const account = this.seedAccount({
      name: input.email.split("@")[0] || "Member",
      email: input.email,
      emailVerified: true,
    });
    this.identities.push({
      ...this.newIdentity(account.id, "email", input.email),
      credentials: {},
    });
    await this.ensurePersonalWorkspace(account.id);
    return this.account(account);
  }

  async createExternalAccount(input: {
    provider: "google" | "github" | "telegram";
    providerId: string;
    name: string;
    email: string | null;
    emailVerified: boolean;
    credentials: Record<string, unknown>;
  }) {
    const account = this.seedAccount({
      name: input.name,
      email: input.email,
      emailVerified: input.emailVerified,
    });
    this.identities.push({
      ...this.newIdentity(account.id, input.provider, input.providerId),
      credentials: input.credentials,
    });
    await this.ensurePersonalWorkspace(account.id);
    return this.account(account);
  }

  async addIdentity(input: {
    userId: number;
    provider: string;
    providerId: string;
    credentials?: Record<string, unknown>;
  }) {
    if (await this.findIdentity(input.provider, input.providerId)) {
      throw new Error("duplicate identity");
    }
    const identity = {
      ...this.newIdentity(input.userId, input.provider, input.providerId),
      credentials: input.credentials ?? {},
    };
    this.identities.push(identity);
    return this.publicIdentity(identity);
  }

  async touchIdentity(id: number, credentials?: Record<string, unknown>) {
    const identity = this.identities.find((item) => item.id === id);
    if (!identity) return;
    identity.lastUsedAt = new Date();
    if (credentials) identity.credentials = credentials;
  }

  async updateProfile(id: number, input: { name?: string; email?: string }) {
    const account = this.accounts.get(id);
    assert.ok(account);
    Object.assign(account, input);
    if (input.email !== undefined) account.emailVerifiedAt = null;
    return this.account(account);
  }

  async markEmailVerified(id: number, email: string) {
    const account = this.accounts.get(id);
    assert.ok(account);
    account.email = email;
    account.emailVerifiedAt = new Date("2026-02-01T00:00:00Z");
    return this.account(account);
  }

  async listIdentities(userId: number) {
    return this.identities
      .filter((identity) => identity.userId === userId)
      .map((identity) => this.publicIdentity(identity));
  }

  async createAuthToken(input: {
    userId: number | null;
    email: string | null;
    type: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    this.tokens = this.tokens.filter(
      (token) => token.email !== input.email || token.type !== input.type || token.consumedAt,
    );
    this.tokens.push({ ...input, id: `token-${this.tokens.length + 1}` });
  }

  async consumeAuthToken(tokenHash: string, type: string, now: Date) {
    const token = this.tokens.find(
      (item) =>
        item.tokenHash === tokenHash &&
        item.type === type &&
        !item.consumedAt &&
        item.expiresAt > now,
    );
    if (!token) return null;
    token.consumedAt = now;
    return {
      id: token.id,
      userId: token.userId,
      email: token.email,
      type: token.type,
      expiresAt: token.expiresAt,
    };
  }

  private newIdentity(userId: number, provider: string, providerId: string): StoredIdentity {
    return {
      id: this.nextIdentityId++,
      userId,
      provider,
      providerId,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      lastUsedAt: null,
    };
  }

  private publicIdentity(
    identity: StoredIdentity & { credentials: Record<string, unknown> },
  ): StoredIdentity {
    const { id, userId, provider, providerId, createdAt, lastUsedAt } = identity;
    return { id, userId, provider, providerId, createdAt, lastUsedAt };
  }
}

class FakeTokenService implements OneTimeTokenService {
  private sequence = 0;

  issue() {
    const raw = `test-one-time-token-${String(++this.sequence).padStart(20, "0")}`;
    return { raw, hash: this.hash(raw) };
  }

  hash(raw: string) {
    return `sha256:${raw}`;
  }
}

class FakeEmailSender implements EmailSender {
  messages: EmailMessage[] = [];
  async send(message: EmailMessage) {
    this.messages.push(message);
  }
}

function createService(repository = new FakeRepository()) {
  const emails = new FakeEmailSender();
  const passwordHasher: PasswordHasher = {
    hash: async (value) => `hashed:${value}`,
    verify: async (value, hash) => hash === `hashed:${value}`,
  };
  const service = new IdentityService({
    repository,
    passwordHasher,
    tokenService: new FakeTokenService(),
    emailSender: emails,
    appOrigin: "https://space.example",
    magicLinkTtlMs: 15 * 60 * 1000,
    clock: { now: () => new Date("2026-02-01T00:00:00Z") },
  });
  return { service, repository, emails };
}

test("register normalizes identity and returns one SaaS workspace", async () => {
  const { service } = createService();
  const user = await service.register({
    username: "  Space.User ",
    password: "long-enough-password",
    name: "Space User",
    email: " SPACE@EXAMPLE.COM ",
  });

  assert.equal(user.username, "space.user");
  assert.equal(user.email, "space@example.com");
  assert.equal(user.workspaces.length, 1);
  assert.equal(user.workspaces[0].role, "owner");
  assert.equal(user.emailVerified, false);
});

test("magic link creates an email identity and cannot be replayed", async () => {
  const { service, repository, emails } = createService();
  await service.requestMagicLink("New.Member@example.com");
  assert.equal(emails.messages.length, 1);
  assert.equal(emails.messages[0].to, "new.member@example.com");
  assert.equal(repository.tokens.length, 1);
  assert.notEqual(repository.tokens[0].tokenHash, emails.messages[0].text);
  assert.match(emails.messages[0].text, /#token=/);

  const rawToken = new URL(emails.messages[0].text).hash.slice("#token=".length);
  const user = await service.consumeMagicLink(rawToken);
  assert.equal(user.email, "new.member@example.com");
  assert.equal(user.emailVerified, true);
  assert.equal(user.workspaces.length, 1);
  assert.equal((await service.listIdentities(user.id))[0].provider, "email");

  await assert.rejects(
    () => service.consumeMagicLink(rawToken),
    (error: unknown) => error instanceof DomainError && error.code === "INVALID_AUTH_TOKEN",
  );
});

test("password login checks the stored credential and returns a stable user", async () => {
  const { service } = createService();
  await service.register({ username: "member-1", password: "strong-password", name: "Member" });

  await assert.rejects(
    () => service.login("member-1", "wrong-password"),
    (error: unknown) => error instanceof DomainError && error.code === "INVALID_CREDENTIALS",
  );
  const user = await service.login("MEMBER-1", "strong-password");
  assert.equal(user.username, "member-1");
  assert.equal(user.workspaces.length, 1);
});

test("external sign-in requires explicit linking for an existing account", async () => {
  const repository = new FakeRepository();
  const verified = repository.seedAccount({
    username: "verified-user",
    name: "Verified User",
    email: "verified@example.com",
    emailVerified: true,
  });
  const unverified = repository.seedAccount({
    username: "unverified-user",
    name: "Unverified User",
    email: "unverified@example.com",
  });
  const { service } = createService(repository);

  const verifiedProfile: ExternalIdentityProfile = {
    provider: "google",
    providerId: "google-verified-sub",
    name: "Verified User",
    email: "verified@example.com",
    emailVerified: true,
  };
  await assert.rejects(
    () => service.signInExternal(verifiedProfile),
    (error: unknown) =>
      error instanceof DomainError && error.code === "ACCOUNT_LINK_REQUIRES_SIGN_IN",
  );
  assert.equal((await service.listIdentities(verified.id)).length, 0);

  const linked = await service.linkExternal(verified.id, verifiedProfile);
  assert.equal(linked.id, verified.id);
  assert.equal((await service.listIdentities(verified.id)).length, 1);

  await assert.rejects(
    () =>
      service.signInExternal({
        ...verifiedProfile,
        providerId: "google-unverified-sub",
        email: "unverified@example.com",
      }),
    (error: unknown) =>
      error instanceof DomainError && error.code === "ACCOUNT_LINK_REQUIRES_SIGN_IN",
  );
  assert.equal((await service.listIdentities(unverified.id)).length, 0);
});

test("account link request rejects an email owned by another user", async () => {
  const repository = new FakeRepository();
  const first = repository.seedAccount({ name: "First", username: "first" });
  repository.seedAccount({
    name: "Second",
    username: "second",
    email: "second@example.com",
  });
  const { service, emails } = createService(repository);

  await assert.rejects(
    () => service.requestAccountLink(first.id, "second@example.com"),
    (error: unknown) => error instanceof DomainError && error.code === "ACCOUNT_LINK_REQUIRES_SIGN_IN",
  );
  assert.equal(emails.messages.length, 0);
});

test("a provider identity cannot be linked to two canonical users", async () => {
  const repository = new FakeRepository();
  const first = repository.seedAccount({ name: "First", username: "first" });
  const second = repository.seedAccount({ name: "Second", username: "second" });
  const { service } = createService(repository);
  const profile: ExternalIdentityProfile = {
    provider: "github",
    providerId: "github-subject-42",
    name: "GitHub Member",
    emailVerified: false,
  };

  await service.linkExternal(first.id, profile);
  await assert.rejects(
    () => service.linkExternal(second.id, profile),
    (error: unknown) => error instanceof DomainError && error.code === "IDENTITY_ALREADY_LINKED",
  );
  assert.equal((await service.listIdentities(first.id)).length, 1);
  assert.equal((await service.listIdentities(second.id)).length, 0);
});

test("Resend adapter sends through the connector with a stable idempotency key", async () => {
  let call:
    | {
        connector: string;
        path: string;
        options: { method?: string; headers?: Record<string, string>; body?: unknown };
      }
    | undefined;
  const sender = new ResendEmailSender("SPACE <auth@example.com>", {
    proxy: async (connector, path, options) => {
      call = { connector, path, options: options ?? {} };
      return new Response(JSON.stringify({ id: "resend-message-id" }), { status: 200 });
    },
  });

  await sender.send({
    to: "member@example.com",
    subject: "Sign in",
    text: "https://space.example/auth/magic-link#token=one-time",
    html: "<p>Sign in</p>",
    kind: "magic_login",
    idempotencyKey: "stable-token-digest",
  });

  assert.equal(call?.connector, "resend");
  assert.equal(call?.path, "/emails");
  assert.equal(call?.options.method, "POST");
  assert.equal(call?.options.headers?.["Idempotency-Key"], "stable-token-digest");
  assert.deepEqual(call?.options.body, {
    from: "SPACE <auth@example.com>",
    to: "member@example.com",
    subject: "Sign in",
    text: "https://space.example/auth/magic-link#token=one-time",
    html: "<p>Sign in</p>",
  });
});

test("Resend adapter rejects missing sender configuration without a network request", async () => {
  let called = false;
  const sender = new ResendEmailSender(undefined, {
    proxy: async () => {
      called = true;
      return new Response(null, { status: 200 });
    },
  });

  await assert.rejects(
    () =>
      sender.send({
        to: "member@example.com",
        subject: "Sign in",
        text: "link",
        kind: "magic_login",
        idempotencyKey: "digest",
      }),
    (error: unknown) =>
      error instanceof DomainError && error.code === "EMAIL_SENDER_NOT_CONFIGURED",
  );
  assert.equal(called, false);
});
