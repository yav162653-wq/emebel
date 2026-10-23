import { env } from "../../config/env";
import { IdentityService } from "./application/identity.service";
import { ExternalAuthService } from "./application/external-auth.service";
import { PrismaIdentityRepository } from "./infrastructure/prisma-identity.repository";
import { BcryptPasswordHasher } from "./infrastructure/bcrypt-password.hasher";
import { CryptoOneTimeTokenService } from "./infrastructure/crypto-token.service";
import { HmacOAuthProofFactory } from "./infrastructure/crypto-oauth-proof";
import { PrismaExternalAuthTransactionStore } from "./infrastructure/prisma-external-auth-transaction.store";
import { createGoogleOidcProvider, createTelegramOidcProvider } from "./infrastructure/oidc-external-auth.provider";
import { GitHubExternalAuthProvider } from "./infrastructure/github-external-auth.provider";
import { ResendEmailSender } from "./infrastructure/resend-email.sender";

export const identityAppOrigin = (env.APP_ORIGIN ?? `http://localhost:${env.PORT}`)
  .split(",")[0]
  .trim();

const tokenService = new CryptoOneTimeTokenService();

export const identityService = new IdentityService({
  repository: new PrismaIdentityRepository(),
  passwordHasher: new BcryptPasswordHasher(),
  tokenService,
  emailSender: new ResendEmailSender(env.AUTH_EMAIL_FROM),
  appOrigin: identityAppOrigin,
  magicLinkTtlMs: env.AUTH_MAGIC_LINK_TTL_MINUTES * 60 * 1000,
});

function externalCallbackUri(provider: "google" | "github" | "telegram") {
  const configuredOrigin = env.APP_ORIGIN?.split(",")[0]?.trim();
  return configuredOrigin
    ? new URL(`/api/auth/external/${provider}/callback`, configuredOrigin).toString()
    : undefined;
}

const externalProviders = [
  createGoogleOidcProvider({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: externalCallbackUri("google"),
  }),
  new GitHubExternalAuthProvider({
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    redirectUri: externalCallbackUri("github"),
  }),
  createTelegramOidcProvider({
    clientId: env.TELEGRAM_CLIENT_ID,
    clientSecret: env.TELEGRAM_CLIENT_SECRET,
    redirectUri: externalCallbackUri("telegram"),
  }),
];

export const externalAuthService = new ExternalAuthService({
  providers: externalProviders,
  transactions: new PrismaExternalAuthTransactionStore(),
  tokenService,
  proofFactory: new HmacOAuthProofFactory(env.SESSION_SECRET),
  identity: identityService,
  transactionTtlMs: 10 * 60 * 1000,
});