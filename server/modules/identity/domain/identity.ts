import { DomainError, invariant } from "../../../../packages/kernel/src";
import type {
  ExternalIdentityProfile,
  IdentityProvider,
} from "../../../../packages/contracts/src";

export const LOCAL_PROVIDER = "local" as const;
export const EMAIL_PROVIDER = "email" as const;
export const MAGIC_LOGIN_TOKEN = "magic_login" as const;
export const ACCOUNT_LINK_TOKEN = "account_link" as const;

export type SupportedIdentityProvider = IdentityProvider;

export function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  invariant(normalized.includes("@"), "INVALID_EMAIL", "A valid email is required");
  return normalized;
}

export function normalizeUsername(username: string): string {
  const normalized = username.trim().toLowerCase();
  invariant(
    /^[a-z0-9][a-z0-9_.-]{2,49}$/.test(normalized),
    "INVALID_USERNAME",
    "Username must contain 3–50 lowercase letters, numbers, dots, underscores, or hyphens",
  );
  return normalized;
}

export function assertExternalProvider(
  provider: string,
): asserts provider is Exclude<IdentityProvider, "local" | "email"> {
  if (!["google", "github", "telegram"].includes(provider)) {
    throw new DomainError("UNSUPPORTED_IDENTITY_PROVIDER", `Unsupported identity provider: ${provider}`);
  }
}

export function normalizeExternalProfile(profile: ExternalIdentityProfile): ExternalIdentityProfile {
  assertExternalProvider(profile.provider);
  return {
    ...profile,
    providerId: profile.providerId.trim(),
    name: profile.name.trim(),
    email: profile.email ? normalizeEmail(profile.email) : undefined,
  };
}