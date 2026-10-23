import type {
  ExternalIdentityProfile,
  IdentityProvider,
} from "../../contracts/src/identity";

export interface PasswordHasher {
  hash(value: string): Promise<string>;
  verify(value: string, hash: string): Promise<boolean>;
}

export interface OneTimeTokenService {
  issue(): { raw: string; hash: string };
  hash(raw: string): string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  kind: "magic_login" | "account_link" | "verification";
  idempotencyKey: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export interface ExternalIdentityProvider {
  readonly provider: Exclude<IdentityProvider, "local" | "email">;
  getAuthorizationUrl(input: { state: string; redirectUri: string }): string;
  exchangeCallback(input: {
    code: string;
    redirectUri: string;
  }): Promise<ExternalIdentityProfile>;
}