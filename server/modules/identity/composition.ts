import { env } from "../../config/env";
import { IdentityService } from "./application/identity.service";
import { PrismaIdentityRepository } from "./infrastructure/prisma-identity.repository";
import { BcryptPasswordHasher } from "./infrastructure/bcrypt-password.hasher";
import { CryptoOneTimeTokenService } from "./infrastructure/crypto-token.service";
import { ConfigurableEmailSender } from "./infrastructure/email.sender";

const appOrigin = (env.APP_ORIGIN ?? `http://localhost:${env.PORT}`)
  .split(",")[0]
  .trim();

export const identityService = new IdentityService({
  repository: new PrismaIdentityRepository(),
  passwordHasher: new BcryptPasswordHasher(),
  tokenService: new CryptoOneTimeTokenService(),
  emailSender: new ConfigurableEmailSender(),
  appOrigin,
  magicLinkTtlMs: env.AUTH_MAGIC_LINK_TTL_MINUTES * 60 * 1000,
});