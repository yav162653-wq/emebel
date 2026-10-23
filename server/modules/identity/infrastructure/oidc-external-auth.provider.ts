import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { DomainError } from "../../../../packages/kernel/src";
import type { ExternalIdentityProfile } from "../../../../packages/contracts/src";
import type {
  ExternalAuthProvider,
  ExternalAuthProviderName,
} from "../domain/external-auth";

interface OidcMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
}

interface OidcProviderOptions {
  provider: "google" | "telegram";
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  discoveryUrl: string;
  issuer: string;
  acceptedIssuers?: string[];
  allowedHosts: string[];
  scopes: string[];
}

function isAllowedHttpsUrl(value: string, hosts: string[]): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function claimString(payload: JWTPayload, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export class OidcExternalAuthProvider implements ExternalAuthProvider {
  readonly provider: ExternalAuthProviderName;
  readonly redirectUri: string | undefined;
  private metadataPromise?: Promise<OidcMetadata>;
  private jwks?: ReturnType<typeof createRemoteJWKSet>;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: OidcProviderOptions, fetcher: typeof fetch = fetch) {
    this.provider = options.provider;
    this.redirectUri = options.redirectUri;
    this.fetcher = fetcher;
  }

  isConfigured(): boolean {
    return Boolean(this.options.clientId && this.options.clientSecret && this.redirectUri);
  }

  async authorizationUrl(input: {
    state: string;
    nonce: string;
    codeChallenge: string;
  }): Promise<string> {
    this.assertConfigured();
    const metadata = await this.getMetadata();
    const url = new URL(metadata.authorization_endpoint);
    url.searchParams.set("client_id", this.options.clientId!);
    url.searchParams.set("redirect_uri", this.redirectUri!);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.options.scopes.join(" "));
    url.searchParams.set("state", input.state);
    url.searchParams.set("nonce", input.nonce);
    url.searchParams.set("code_challenge", input.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    if (this.provider === "google") url.searchParams.set("prompt", "select_account");
    return url.toString();
  }

  async authenticate(input: {
    code: string;
    codeVerifier: string;
    nonce: string;
  }): Promise<ExternalIdentityProfile> {
    this.assertConfigured();
    try {
      const metadata = await this.getMetadata();
      const tokenResponse = await this.fetcher(metadata.token_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({
          client_id: this.options.clientId!,
          client_secret: this.options.clientSecret!,
          code: input.code,
          code_verifier: input.codeVerifier,
          grant_type: "authorization_code",
          redirect_uri: this.redirectUri!,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!tokenResponse.ok) throw new Error("Token exchange rejected");
      const tokens = await tokenResponse.json() as { id_token?: unknown };
      if (typeof tokens.id_token !== "string") throw new Error("Missing ID token");

      const { payload } = await jwtVerify(
        tokens.id_token,
        this.getJwks(metadata),
        {
          issuer: this.options.acceptedIssuers ?? this.options.issuer,
          audience: this.options.clientId,
          algorithms: ["RS256"],
          maxTokenAge: "10m",
        },
      );
      if (claimString(payload, "nonce") !== input.nonce) {
        throw new Error("OIDC nonce mismatch");
      }

      const providerId = claimString(payload, "sub");
      if (!providerId) throw new Error("Missing subject");
      const email = claimString(payload, "email");
      const verified = payload.email_verified === true;
      const name =
        claimString(payload, "name")
        ?? claimString(payload, "preferred_username")
        ?? `${this.provider} member`;

      return {
        provider: this.provider,
        providerId,
        name: name.slice(0, 120),
        ...(email ? { email } : {}),
        emailVerified: verified,
      };
    } catch {
      throw new DomainError(
        "EXTERNAL_AUTH_PROVIDER_FAILED",
        "The identity provider could not verify this sign-in",
      );
    }
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new DomainError("EXTERNAL_AUTH_NOT_CONFIGURED", "This sign-in provider is not configured");
    }
  }

  private getJwks(metadata: OidcMetadata) {
    if (!this.jwks) this.jwks = createRemoteJWKSet(new URL(metadata.jwks_uri));
    return this.jwks;
  }

  private async getMetadata(): Promise<OidcMetadata> {
    if (!this.metadataPromise) {
      this.metadataPromise = this.loadMetadata().catch((error) => {
        this.metadataPromise = undefined;
        throw error;
      });
    }
    return this.metadataPromise;
  }

  private async loadMetadata(): Promise<OidcMetadata> {
    try {
      const response = await this.fetcher(this.options.discoveryUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error("Discovery failed");
      const metadata = await response.json() as Partial<OidcMetadata>;
      const allowedIssuer = [this.options.issuer, ...(this.options.acceptedIssuers ?? [])]
        .includes(metadata.issuer ?? "");
      if (
        !allowedIssuer
        || typeof metadata.authorization_endpoint !== "string"
        || typeof metadata.token_endpoint !== "string"
        || typeof metadata.jwks_uri !== "string"
        || !isAllowedHttpsUrl(metadata.authorization_endpoint, this.options.allowedHosts)
        || !isAllowedHttpsUrl(metadata.token_endpoint, this.options.allowedHosts)
        || !isAllowedHttpsUrl(metadata.jwks_uri, this.options.allowedHosts)
      ) {
        throw new Error("Unexpected OIDC metadata");
      }
      return metadata as OidcMetadata;
    } catch {
      throw new DomainError(
        "EXTERNAL_AUTH_PROVIDER_UNAVAILABLE",
        "The identity provider is temporarily unavailable",
      );
    }
  }
}

export function createGoogleOidcProvider(input: {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}): OidcExternalAuthProvider {
  return new OidcExternalAuthProvider({
    provider: "google",
    ...input,
    discoveryUrl: "https://accounts.google.com/.well-known/openid-configuration",
    issuer: "https://accounts.google.com",
    acceptedIssuers: ["accounts.google.com"],
    allowedHosts: ["accounts.google.com", "googleapis.com"],
    scopes: ["openid", "email", "profile"],
  });
}

export function createTelegramOidcProvider(input: {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}): OidcExternalAuthProvider {
  return new OidcExternalAuthProvider({
    provider: "telegram",
    ...input,
    discoveryUrl: "https://oauth.telegram.org/.well-known/openid-configuration",
    issuer: "https://oauth.telegram.org",
    allowedHosts: ["oauth.telegram.org"],
    scopes: ["openid", "profile"],
  });
}
