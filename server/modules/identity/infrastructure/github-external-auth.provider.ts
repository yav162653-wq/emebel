import { DomainError } from "../../../../packages/kernel/src";
import type { ExternalIdentityProfile } from "../../../../packages/contracts/src";
import type {
  ExternalAuthProvider,
  ExternalAuthProviderName,
} from "../domain/external-auth";

interface GitHubProfile {
  id?: unknown;
  name?: unknown;
  login?: unknown;
}

interface GitHubEmail {
  email?: unknown;
  primary?: unknown;
  verified?: unknown;
}

interface GitHubOAuthOptions {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

export class GitHubExternalAuthProvider implements ExternalAuthProvider {
  readonly provider: ExternalAuthProviderName = "github";
  readonly redirectUri: string | undefined;

  constructor(
    private readonly options: GitHubOAuthOptions,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.redirectUri = options.redirectUri;
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
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", this.options.clientId!);
    url.searchParams.set("redirect_uri", this.redirectUri!);
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", input.state);
    url.searchParams.set("code_challenge", input.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    return url.toString();
  }

  async authenticate(input: {
    code: string;
    codeVerifier: string;
    nonce: string;
  }): Promise<ExternalIdentityProfile> {
    this.assertConfigured();
    try {
      const tokenResponse = await this.fetcher("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: this.options.clientId,
          client_secret: this.options.clientSecret,
          code: input.code,
          redirect_uri: this.redirectUri,
          code_verifier: input.codeVerifier,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!tokenResponse.ok) throw new Error("Token exchange rejected");
      const tokenData = await tokenResponse.json() as { access_token?: unknown; token_type?: unknown };
      if (
        typeof tokenData.access_token !== "string"
        || typeof tokenData.token_type !== "string"
        || tokenData.token_type.toLowerCase() !== "bearer"
      ) {
        throw new Error("Invalid access token response");
      }

      const headers = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenData.access_token}`,
        "X-GitHub-Api-Version": "2026-03-10",
        "User-Agent": "SPACE-Identity",
      };
      const [profileResponse, emailResponse] = await Promise.all([
        this.fetcher("https://api.github.com/user", {
          headers,
          signal: AbortSignal.timeout(10_000),
        }),
        this.fetcher("https://api.github.com/user/emails", {
          headers,
          signal: AbortSignal.timeout(10_000),
        }),
      ]);
      if (!profileResponse.ok || !emailResponse.ok) throw new Error("GitHub profile lookup failed");
      const profile = await profileResponse.json() as GitHubProfile;
      const emails = await emailResponse.json() as GitHubEmail[];
      const id = typeof profile.id === "number" ? profile.id : Number.NaN;
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid GitHub identity");

      const verifiedEmail = Array.isArray(emails)
        ? emails.find((email) => email.primary === true && email.verified === true)
          ?? emails.find((email) => email.verified === true)
        : undefined;
      const email = typeof verifiedEmail?.email === "string" ? verifiedEmail.email : undefined;
      const name =
        (typeof profile.name === "string" && profile.name.trim())
        || (typeof profile.login === "string" && profile.login.trim())
        || "GitHub member";

      return {
        provider: "github",
        providerId: String(id),
        name: name.slice(0, 120),
        ...(email ? { email } : {}),
        emailVerified: Boolean(email),
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
}
