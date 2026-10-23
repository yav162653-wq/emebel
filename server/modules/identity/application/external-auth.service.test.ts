import assert from "node:assert/strict";
import test from "node:test";
import { DomainError } from "../../../../packages/kernel/src";
import type { ExternalIdentityProfile, PublicUser } from "../../../../packages/contracts/src";
import { CryptoOneTimeTokenService } from "../infrastructure/crypto-token.service";
import { HmacOAuthProofFactory } from "../infrastructure/crypto-oauth-proof";
import type {
  ExternalAuthProvider,
  ExternalAuthProviderName,
  ExternalAuthTransactionStore,
} from "../domain/external-auth";
import { ExternalAuthService } from "./external-auth.service";

class MemoryTransactionStore implements ExternalAuthTransactionStore {
  private readonly rows = new Map<string, {
    provider: ExternalAuthProviderName;
    userId: number | null;
    expiresAt: Date;
    consumed: boolean;
  }>();

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

class FakeExternalProvider implements ExternalAuthProvider {
  readonly provider = "google" as const;
  readonly redirectUri = "https://space.example/api/auth/external/google/callback";
  configured = true;
  authenticateCalls = 0;

  isConfigured() {
    return this.configured;
  }

  async authorizationUrl(input: { state: string; nonce: string; codeChallenge: string }) {
    const url = new URL("https://accounts.google.com/auth");
    url.searchParams.set("state", input.state);
    url.searchParams.set("nonce", input.nonce);
    url.searchParams.set("code_challenge", input.codeChallenge);
    return url.toString();
  }

  async authenticate(input: { code: string; codeVerifier: string; nonce: string }) {
    this.authenticateCalls += 1;
    assert.equal(input.code, "provider-code");
    assert.equal(input.codeVerifier.length, 43);
    assert.equal(input.nonce.length, 43);
    return {
      provider: "google",
      providerId: "google-subject",
      name: "Google Member",
      email: "member@example.com",
      emailVerified: true,
    } satisfies ExternalIdentityProfile;
  }
}

function publicUser(id: number): PublicUser {
  return {
    id,
    username: null,
    name: "Member",
    email: "member@example.com",
    emailVerified: true,
    role: "user",
    createdAt: "2026-01-01T00:00:00.000Z",
    workspaces: [],
  };
}

function createHarness() {
  const provider = new FakeExternalProvider();
  const transactions = new MemoryTransactionStore();
  const signedIn: ExternalIdentityProfile[] = [];
  const linked: Array<{ userId: number; profile: ExternalIdentityProfile }> = [];
  const service = new ExternalAuthService({
    providers: [provider],
    transactions,
    tokenService: new CryptoOneTimeTokenService(),
    proofFactory: new HmacOAuthProofFactory("test-session-secret-that-is-long-enough"),
    identity: {
      async signInExternal(profile) {
        signedIn.push(profile);
        return publicUser(7);
      },
      async linkExternal(userId, profile) {
        linked.push({ userId, profile });
        return publicUser(userId);
      },
    },
    transactionTtlMs: 10 * 60 * 1000,
    clock: { now: () => new Date("2026-01-01T00:00:00.000Z") },
  });
  return { service, provider, signedIn, linked };
}

test("external sign-in creates PKCE state and consumes it once", async () => {
  const { service, signedIn } = createHarness();
  const authorizationUrl = new URL(await service.begin("google"));
  const state = authorizationUrl.searchParams.get("state")!;
  assert.equal(authorizationUrl.searchParams.get("code_challenge_method"), null);
  assert.equal(authorizationUrl.searchParams.get("code_challenge")?.length, 43);

  const result = await service.complete("google", { code: "provider-code", state });
  assert.equal(result.user.id, 7);
  assert.equal(result.linked, false);
  assert.equal(signedIn.length, 1);
  await assert.rejects(
    () => service.complete("google", { code: "provider-code", state }),
    (error: unknown) => error instanceof DomainError && error.code === "INVALID_EXTERNAL_AUTH_STATE",
  );
});

test("link callback requires the same authenticated user that started it", async () => {
  const { service, provider, linked } = createHarness();
  const authorizationUrl = new URL(await service.begin("google", 42));
  const state = authorizationUrl.searchParams.get("state")!;

  await assert.rejects(
    () => service.complete("google", { code: "provider-code", state, currentUserId: 43 }),
    (error: unknown) => error instanceof DomainError && error.code === "EXTERNAL_AUTH_SESSION_CHANGED",
  );
  assert.equal(provider.authenticateCalls, 0);
  assert.equal(linked.length, 0);
});

test("link flow attaches provider identity to the initiating canonical user", async () => {
  const { service, linked } = createHarness();
  const authorizationUrl = new URL(await service.begin("google", 42));
  const result = await service.complete("google", {
    code: "provider-code",
    state: authorizationUrl.searchParams.get("state")!,
    currentUserId: 42,
  });
  assert.equal(result.linked, true);
  assert.equal(result.user.id, 42);
  assert.equal(linked.length, 1);
  assert.equal(linked[0].userId, 42);
});

test("unconfigured providers are not advertised or started", async () => {
  const { service, provider } = createHarness();
  provider.configured = false;
  assert.deepEqual(service.availableProviders(), []);
  await assert.rejects(
    () => service.begin("google"),
    (error: unknown) => error instanceof DomainError && error.code === "EXTERNAL_AUTH_NOT_CONFIGURED",
  );
});
