import assert from "node:assert/strict";
import test from "node:test";
import { DomainError } from "../../../../packages/kernel/src";
import { GitHubExternalAuthProvider } from "./github-external-auth.provider";
import { OidcExternalAuthProvider } from "./oidc-external-auth.provider";

function fakeFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
    return handler(url, init);
  }) as typeof fetch;
}

test("GitHub authorization requests state, email scope, and S256 PKCE", async () => {
  const provider = new GitHubExternalAuthProvider({
    clientId: "github-client",
    clientSecret: "test-secret",
    redirectUri: "https://space.example/api/auth/external/github/callback",
  });
  const url = new URL(await provider.authorizationUrl({
    state: "csrf-state",
    nonce: "nonce",
    codeChallenge: "s256-challenge",
  }));
  assert.equal(url.origin, "https://github.com");
  assert.equal(url.searchParams.get("state"), "csrf-state");
  assert.equal(url.searchParams.get("scope"), "read:user user:email");
  assert.equal(url.searchParams.get("code_challenge"), "s256-challenge");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
});

test("GitHub login accepts only an API-verified email and stores no bearer token", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = fakeFetch((url, init) => {
    requests.push({ url, init });
    if (url.endsWith("/access_token")) {
      return Response.json({ access_token: "provider-bearer-token", token_type: "bearer" });
    }
    if (url.endsWith("/user/emails")) {
      return Response.json([
        { email: "primary@example.com", primary: true, verified: false },
        { email: "verified@example.com", primary: false, verified: true },
      ]);
    }
    return Response.json({ id: 1234, name: "GitHub User", login: "github-user" });
  });
  const provider = new GitHubExternalAuthProvider({
    clientId: "github-client",
    clientSecret: "test-secret",
    redirectUri: "https://space.example/api/auth/external/github/callback",
  }, fetcher);

  const profile = await provider.authenticate({
    code: "one-time-code",
    codeVerifier: "verifier",
    nonce: "unused-for-github",
  });
  assert.equal(profile.providerId, "1234");
  assert.equal(profile.email, "verified@example.com");
  assert.equal(profile.emailVerified, true);
  assert.equal(profile.credentials, undefined);
  assert.equal(requests.length, 3);
  assert.equal(
    (requests[2].init?.headers as Record<string, string>).Authorization,
    "Bearer provider-bearer-token",
  );
});

test("OIDC discovery accepts only the configured issuer and secure provider endpoints", async () => {
  const fetcher = fakeFetch(() => Response.json({
    issuer: "https://oauth.telegram.org",
    authorization_endpoint: "https://oauth.telegram.org/auth",
    token_endpoint: "https://oauth.telegram.org/token",
    jwks_uri: "https://oauth.telegram.org/.well-known/jwks.json",
  }));
  const provider = new OidcExternalAuthProvider({
    provider: "telegram",
    clientId: "telegram-client",
    clientSecret: "test-secret",
    redirectUri: "https://space.example/api/auth/external/telegram/callback",
    discoveryUrl: "https://oauth.telegram.org/.well-known/openid-configuration",
    issuer: "https://oauth.telegram.org",
    allowedHosts: ["oauth.telegram.org"],
    scopes: ["openid", "profile"],
  }, fetcher);

  const url = new URL(await provider.authorizationUrl({
    state: "csrf-state",
    nonce: "oidc-nonce",
    codeChallenge: "s256-challenge",
  }));
  assert.equal(url.origin, "https://oauth.telegram.org");
  assert.equal(url.searchParams.get("scope"), "openid profile");
  assert.equal(url.searchParams.get("nonce"), "oidc-nonce");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
});

test("OIDC discovery rejects endpoint substitution", async () => {
  const fetcher = fakeFetch(() => Response.json({
    issuer: "https://oauth.telegram.org",
    authorization_endpoint: "https://attacker.example/auth",
    token_endpoint: "https://oauth.telegram.org/token",
    jwks_uri: "https://oauth.telegram.org/.well-known/jwks.json",
  }));
  const provider = new OidcExternalAuthProvider({
    provider: "telegram",
    clientId: "telegram-client",
    clientSecret: "test-secret",
    redirectUri: "https://space.example/api/auth/external/telegram/callback",
    discoveryUrl: "https://oauth.telegram.org/.well-known/openid-configuration",
    issuer: "https://oauth.telegram.org",
    allowedHosts: ["oauth.telegram.org"],
    scopes: ["openid", "profile"],
  }, fetcher);

  await assert.rejects(
    () => provider.authorizationUrl({ state: "state", nonce: "nonce", codeChallenge: "challenge" }),
    (error: unknown) =>
      error instanceof DomainError && error.code === "EXTERNAL_AUTH_PROVIDER_UNAVAILABLE",
  );
});
