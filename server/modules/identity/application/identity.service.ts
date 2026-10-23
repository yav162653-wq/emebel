import { DomainError, systemClock, type Clock } from "../../../../packages/kernel/src";
import type {
  ExternalIdentityProfile,
  PublicIdentity,
  PublicUser,
} from "../../../../packages/contracts/src";
import type {
  EmailSender,
  OneTimeTokenService,
  PasswordHasher,
} from "../../../../packages/platform/src";
import {
  ACCOUNT_LINK_TOKEN,
  EMAIL_PROVIDER,
  LOCAL_PROVIDER,
  MAGIC_LOGIN_TOKEN,
  normalizeEmail,
  normalizeExternalProfile,
  normalizeUsername,
} from "../domain/identity";
import type { IdentityAccount, IdentityRepository } from "../domain/identity.repository";

export interface IdentityServiceDependencies {
  repository: IdentityRepository;
  passwordHasher: PasswordHasher;
  tokenService: OneTimeTokenService;
  emailSender: EmailSender;
  clock?: Clock;
  appOrigin: string;
  magicLinkTtlMs: number;
}

function toPublicUser(account: IdentityAccount): PublicUser {
  return {
    id: account.id,
    username: account.username,
    name: account.name,
    email: account.email,
    emailVerified: Boolean(account.emailVerifiedAt),
    role: account.role,
    createdAt: account.createdAt.toISOString(),
    workspaces: account.memberships.map((membership) => ({
      id: membership.id,
      organizationId: membership.organizationId,
      organizationName: membership.organizationName,
      organizationSlug: membership.organizationSlug,
      plan: membership.plan,
      role: membership.role,
      status: membership.status,
    })),
  };
}

function toPublicIdentity(identity: Awaited<ReturnType<IdentityRepository["listIdentities"]>>[number]): PublicIdentity {
  return {
    id: identity.id,
    provider: identity.provider,
    providerId: identity.providerId,
    createdAt: identity.createdAt.toISOString(),
    lastUsedAt: identity.lastUsedAt?.toISOString() ?? null,
  };
}

export class IdentityService {
  private readonly clock: Clock;

  constructor(private readonly dependencies: IdentityServiceDependencies) {
    this.clock = dependencies.clock ?? systemClock;
  }

  async register(input: {
    username: string;
    password: string;
    name: string;
    email?: string;
  }): Promise<PublicUser> {
    const username = normalizeUsername(input.username);
    const email = input.email ? normalizeEmail(input.email) : null;

    if (await this.dependencies.repository.findUserByUsername(username)) {
      throw new DomainError("USERNAME_TAKEN", "Username already taken");
    }
    if (email && (await this.dependencies.repository.findUserByEmail(email))) {
      throw new DomainError("EMAIL_IN_USE", "Email is already in use");
    }

    const passwordHash = await this.dependencies.passwordHasher.hash(input.password);
    const account = await this.dependencies.repository.createLocalAccount({
      username,
      name: input.name.trim(),
      email,
      passwordHash,
    });
    return toPublicUser(account);
  }

  async login(usernameInput: string, password: string): Promise<PublicUser> {
    const username = normalizeUsername(usernameInput);
    const [account, passwordHash] = await Promise.all([
      this.dependencies.repository.findUserByUsername(username),
      this.dependencies.repository.findLocalPasswordHash(username),
    ]);

    if (!account || !passwordHash || !(await this.dependencies.passwordHasher.verify(password, passwordHash))) {
      throw new DomainError("INVALID_CREDENTIALS", "Invalid credentials");
    }

    const identity = await this.dependencies.repository.findIdentity(LOCAL_PROVIDER, username);
    if (identity) await this.dependencies.repository.touchIdentity(identity.id);
    const refreshed = await this.getById(account.id);
    if (!refreshed) throw new DomainError("ACCOUNT_NOT_FOUND", "Account not found");
    return refreshed;
  }

  async getById(id: number): Promise<PublicUser | null> {
    const account = await this.dependencies.repository.findUserById(id);
    if (account && account.memberships.length === 0) {
      await this.dependencies.repository.ensurePersonalWorkspace(id);
    }
    const refreshed =
      account?.memberships.length === 0
        ? await this.dependencies.repository.findUserById(id)
        : account;
    return refreshed ? toPublicUser(refreshed) : null;
  }

  async updateProfile(
    id: number,
    input: { name?: string; email?: string },
  ): Promise<PublicUser> {
    if (input.email) {
      const email = normalizeEmail(input.email);
      const existing = await this.dependencies.repository.findUserByEmail(email);
      if (existing && existing.id !== id) throw new DomainError("EMAIL_IN_USE", "Email is already in use");
      input = { ...input, email };
    }
    const account = await this.dependencies.repository.updateProfile(id, input);
    return toPublicUser(account);
  }

  async listIdentities(userId: number): Promise<PublicIdentity[]> {
    const identities = await this.dependencies.repository.listIdentities(userId);
    return identities.map(toPublicIdentity);
  }

  async requestMagicLink(emailInput: string): Promise<void> {
    const email = normalizeEmail(emailInput);
    const account = await this.dependencies.repository.findUserByEmail(email);
    const token = this.dependencies.tokenService.issue();
    const expiresAt = new Date(this.clock.now().getTime() + this.dependencies.magicLinkTtlMs);

    await this.dependencies.repository.createAuthToken({
      userId: account?.id ?? null,
      email,
      type: MAGIC_LOGIN_TOKEN,
      tokenHash: token.hash,
      expiresAt,
    });

    const link = `${this.dependencies.appOrigin}/auth/magic-link#token=${encodeURIComponent(token.raw)}`;
    await this.dependencies.emailSender.send({
      to: email,
      kind: "magic_login",
      subject: "Your secure sign-in link",
      text: link,
      html: `<p>Use this secure sign-in link. It expires soon:</p><p><a href="${link}">Sign in</a></p>`,
      idempotencyKey: token.hash,
    });
  }

  async consumeMagicLink(rawToken: string): Promise<PublicUser> {
    const pending = await this.consumeToken(rawToken, MAGIC_LOGIN_TOKEN);
    if (!pending.email) throw new DomainError("INVALID_AUTH_TOKEN", "Invalid or expired sign-in link");

    let account: IdentityAccount;
    if (pending.userId) {
      account = await this.requireAccount(pending.userId);
      const emailIdentity = await this.dependencies.repository.findIdentity(
        EMAIL_PROVIDER,
        pending.email,
      );
      if (!emailIdentity) {
        await this.dependencies.repository.addIdentity({
          userId: account.id,
          provider: EMAIL_PROVIDER,
          providerId: pending.email,
        });
      }
      account = await this.dependencies.repository.markEmailVerified(account.id, pending.email);
    } else {
      account = await this.dependencies.repository.createEmailAccount({ email: pending.email });
    }
    return toPublicUser(account);
  }

  async requestAccountLink(userId: number, emailInput: string): Promise<void> {
    const email = normalizeEmail(emailInput);
    await this.requireAccount(userId);
    const existing = await this.dependencies.repository.findUserByEmail(email);
    if (existing && existing.id !== userId) {
      throw new DomainError(
        "ACCOUNT_LINK_REQUIRES_SIGN_IN",
        "That email already belongs to another account. Sign in to that account before linking providers.",
      );
    }

    const token = this.dependencies.tokenService.issue();
    const expiresAt = new Date(this.clock.now().getTime() + this.dependencies.magicLinkTtlMs);
    await this.dependencies.repository.createAuthToken({
      userId,
      email,
      type: ACCOUNT_LINK_TOKEN,
      tokenHash: token.hash,
      expiresAt,
    });

    const link = `${this.dependencies.appOrigin}/auth/account-link#token=${encodeURIComponent(token.raw)}`;
    await this.dependencies.emailSender.send({
      to: email,
      kind: "account_link",
      subject: "Confirm your account email",
      text: link,
      html: `<p>Confirm this email for your account:</p><p><a href="${link}">Confirm email</a></p>`,
      idempotencyKey: token.hash,
    });
  }

  async consumeAccountLink(rawToken: string): Promise<PublicUser> {
    const pending = await this.consumeToken(rawToken, ACCOUNT_LINK_TOKEN);
    if (!pending.userId || !pending.email) {
      throw new DomainError("INVALID_AUTH_TOKEN", "Invalid or expired account link");
    }

    const existingIdentity = await this.dependencies.repository.findIdentity(EMAIL_PROVIDER, pending.email);
    if (existingIdentity && existingIdentity.userId !== pending.userId) {
      throw new DomainError("EMAIL_IN_USE", "Email is already linked to another account");
    }
    if (!existingIdentity) {
      await this.dependencies.repository.addIdentity({
        userId: pending.userId,
        provider: EMAIL_PROVIDER,
        providerId: pending.email,
      });
    }

    return toPublicUser(
      await this.dependencies.repository.markEmailVerified(pending.userId, pending.email),
    );
  }

  async signInExternal(profileInput: ExternalIdentityProfile): Promise<PublicUser> {
    const profile = normalizeExternalProfile(profileInput);
    const existingIdentity = await this.dependencies.repository.findIdentity(
      profile.provider,
      profile.providerId,
    );

    if (existingIdentity) {
      await this.dependencies.repository.touchIdentity(existingIdentity.id, profile.credentials);
      return this.requireAccount(existingIdentity.userId).then(toPublicUser);
    }

    const existingAccount = profile.email
      ? await this.dependencies.repository.findUserByEmail(profile.email)
      : null;
    if (existingAccount) {
      if (!profile.emailVerified || !existingAccount.emailVerifiedAt) {
        throw new DomainError(
          "ACCOUNT_LINK_REQUIRES_SIGN_IN",
          "Sign in to the existing account before linking this provider",
        );
      }
      await this.dependencies.repository.addIdentity({
        userId: existingAccount.id,
        provider: profile.provider,
        providerId: profile.providerId,
        credentials: profile.credentials,
      });
      const refreshed = await this.getById(existingAccount.id);
      if (!refreshed) throw new DomainError("ACCOUNT_NOT_FOUND", "Account not found");
      return refreshed;
    }

    const account = await this.dependencies.repository.createExternalAccount({
      provider: profile.provider,
      providerId: profile.providerId,
      name: profile.name,
      email: profile.email ?? null,
      emailVerified: profile.emailVerified,
      credentials: profile.credentials ?? {},
    });
    return toPublicUser(account);
  }

  private async consumeToken(rawToken: string, type: string) {
    const tokenHash = this.dependencies.tokenService.hash(rawToken);
    const pending = await this.dependencies.repository.consumeAuthToken(
      tokenHash,
      type,
      this.clock.now(),
    );
    if (!pending) throw new DomainError("INVALID_AUTH_TOKEN", "Invalid or expired authentication link");
    return pending;
  }

  private async requireAccount(id: number): Promise<IdentityAccount> {
    const account = await this.dependencies.repository.findUserById(id);
    if (!account) throw new DomainError("ACCOUNT_NOT_FOUND", "Account not found");
    return account;
  }
}