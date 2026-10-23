import { Prisma } from "@prisma/client";
import { db } from "../../../db/client";
import type {
  IdentityAccount,
  IdentityMembership,
  IdentityRepository,
  StoredAuthToken,
  StoredIdentity,
} from "../domain/identity.repository";

type DbUser = {
  id: number;
  username: string | null;
  name: string;
  email: string | null;
  emailVerifiedAt: Date | null;
  role: string;
  createdAt: Date;
  memberships?: Array<{
    id: string;
    organizationId: string;
    role: string;
    status: string;
    organization: {
      name: string;
      slug: string;
      plan: string;
    };
  }>;
};

function mapMembership(membership: NonNullable<DbUser["memberships"]>[number]): IdentityMembership {
  return {
    id: membership.id,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    organizationSlug: membership.organization.slug,
    plan: membership.organization.plan,
    role: membership.role,
    status: membership.status,
  };
}

function mapUser(user: DbUser): IdentityAccount {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    role: user.role,
    createdAt: user.createdAt,
    memberships: (user.memberships ?? []).map(mapMembership),
  };
}

function mapIdentity(identity: {
  id: number;
  userId: number;
  provider: string;
  providerId: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}): StoredIdentity {
  return {
    id: identity.id,
    userId: identity.userId,
    provider: identity.provider,
    providerId: identity.providerId,
    createdAt: identity.createdAt,
    lastUsedAt: identity.lastUsedAt,
  };
}

const userInclude = {
  memberships: {
    include: { organization: true },
    where: { status: "active" },
  },
} as const;

export class PrismaIdentityRepository implements IdentityRepository {
  async findUserById(id: number): Promise<IdentityAccount | null> {
    const user = await db.user.findUnique({ where: { id }, include: userInclude });
    return user ? mapUser(user) : null;
  }

  async findUserByUsername(username: string): Promise<IdentityAccount | null> {
    const user = await db.user.findUnique({ where: { username }, include: userInclude });
    return user ? mapUser(user) : null;
  }

  async findUserByEmail(email: string): Promise<IdentityAccount | null> {
    const user = await db.user.findUnique({ where: { email }, include: userInclude });
    return user ? mapUser(user) : null;
  }

  async findIdentity(provider: string, providerId: string): Promise<StoredIdentity | null> {
    const identity = await db.identity.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });
    return identity ? mapIdentity(identity) : null;
  }

  async findIdentityForUser(userId: number, provider: string): Promise<StoredIdentity | null> {
    const identity = await db.identity.findFirst({ where: { userId, provider } });
    return identity ? mapIdentity(identity) : null;
  }

  async findLocalPasswordHash(username: string): Promise<string | null> {
    const identity = await db.identity.findUnique({
      where: { provider_providerId: { provider: "local", providerId: username } },
      select: { credentials: true },
    });
    const credentials =
      identity?.credentials && typeof identity.credentials === "object"
        ? (identity.credentials as { hash?: unknown })
        : null;
    return typeof credentials?.hash === "string" ? credentials.hash : null;
  }

  private async createPersonalWorkspace<T extends { userId: number }>(
    client: Prisma.TransactionClient,
    account: T,
    name: string,
  ): Promise<void> {
    const organization = await client.organization.upsert({
      where: { slug: `workspace-${account.userId}` },
      update: {},
      create: {
        name: `${name}'s Workspace`,
        slug: `workspace-${account.userId}`,
      },
    });
    await client.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: account.userId,
        },
      },
      update: { status: "active" },
      create: {
        organizationId: organization.id,
        userId: account.userId,
        role: "owner",
        status: "active",
      },
    });
  }

  async ensurePersonalWorkspace(userId: number): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    if (!user) return;
    await db.$transaction((tx) =>
      this.createPersonalWorkspace(tx, { userId: user.id }, user.name),
    );
  }

  async createLocalAccount(input: {
    username: string;
    name: string;
    email: string | null;
    passwordHash: string;
  }): Promise<IdentityAccount> {
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: input.username,
          name: input.name,
          email: input.email,
          role: "user",
        },
      });
      await tx.identity.create({
        data: {
          userId: created.id,
          provider: "local",
          providerId: input.username,
          credentials: { hash: input.passwordHash },
        },
      });
      await this.createPersonalWorkspace(tx, { userId: created.id }, input.name);
      return created;
    });

    const result = await db.user.findUnique({ where: { id: user.id }, include: userInclude });
    return mapUser(result!);
  }

  async createEmailAccount(input: { email: string }): Promise<IdentityAccount> {
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.email.split("@")[0] || "Member",
          email: input.email,
          emailVerifiedAt: new Date(),
          role: "user",
        },
      });
      await tx.identity.create({
        data: {
          userId: created.id,
          provider: "email",
          providerId: input.email,
          credentials: {},
        },
      });
      await this.createPersonalWorkspace(tx, { userId: created.id }, created.name);
      return created;
    });

    const result = await db.user.findUnique({ where: { id: user.id }, include: userInclude });
    return mapUser(result!);
  }

  async createExternalAccount(input: {
    provider: "google" | "github" | "telegram";
    providerId: string;
    name: string;
    email: string | null;
    emailVerified: boolean;
    credentials: Record<string, unknown>;
  }): Promise<IdentityAccount> {
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          emailVerifiedAt: input.email && input.emailVerified ? new Date() : null,
          role: "user",
        },
      });
      await tx.identity.create({
        data: {
          userId: created.id,
          provider: input.provider,
          providerId: input.providerId,
          credentials: input.credentials as Prisma.InputJsonValue,
        },
      });
      await this.createPersonalWorkspace(tx, { userId: created.id }, input.name);
      return created;
    });

    const result = await db.user.findUnique({ where: { id: user.id }, include: userInclude });
    return mapUser(result!);
  }

  async addIdentity(input: {
    userId: number;
    provider: string;
    providerId: string;
    credentials?: Record<string, unknown>;
  }): Promise<StoredIdentity> {
    const identity = await db.identity.create({
      data: {
        userId: input.userId,
        provider: input.provider,
        providerId: input.providerId,
        credentials: (input.credentials ?? {}) as Prisma.InputJsonValue,
      },
    });
    return mapIdentity(identity);
  }

  async touchIdentity(id: number, credentials?: Record<string, unknown>): Promise<void> {
    await db.identity.update({
      where: { id },
      data: {
        lastUsedAt: new Date(),
        ...(credentials
          ? { credentials: credentials as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async updateProfile(
    id: number,
    input: { name?: string; email?: string },
  ): Promise<IdentityAccount> {
    const user = await db.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined
          ? { email: input.email, emailVerifiedAt: null }
          : {}),
      },
      include: userInclude,
    });
    return mapUser(user);
  }

  async markEmailVerified(id: number, email: string): Promise<IdentityAccount> {
    const user = await db.user.update({
      where: { id },
      data: { email, emailVerifiedAt: new Date() },
      include: userInclude,
    });
    return mapUser(user);
  }

  async listIdentities(userId: number): Promise<StoredIdentity[]> {
    const identities = await db.identity.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return identities.map(mapIdentity);
  }

  async createAuthToken(input: {
    userId: number | null;
    email: string | null;
    type: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await db.authToken.deleteMany({
      where: {
        email: input.email,
        type: input.type,
        consumedAt: null,
      },
    });
    await db.authToken.create({ data: input });
  }

  async consumeAuthToken(
    tokenHash: string,
    type: string,
    now: Date,
  ): Promise<StoredAuthToken | null> {
    const token = await db.authToken.findUnique({ where: { tokenHash } });
    if (!token || token.type !== type || token.consumedAt || token.expiresAt <= now) {
      return null;
    }

    const claimed = await db.authToken.updateMany({
      where: { id: token.id, consumedAt: null },
      data: { consumedAt: now },
    });
    if (claimed.count !== 1) return null;

    return {
      id: token.id,
      userId: token.userId,
      email: token.email,
      type: token.type,
      expiresAt: token.expiresAt,
    };
  }
}