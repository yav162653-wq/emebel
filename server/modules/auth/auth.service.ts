import bcrypt from "bcryptjs";
import { db } from "../../db/client";
import { UnauthorizedError, ConflictError, NotFoundError } from "../../utils/errors";

const SALT_ROUNDS = 12;

export type SafeUser = {
  id:        number;
  username:  string | null;
  name:      string;
  email:     string | null;
  role:      string;
  createdAt: Date;
};

function toSafeUser(user: {
  id: number; username: string | null; name: string;
  email: string | null; role: string; createdAt: Date;
}): SafeUser {
  return {
    id:        user.id,
    username:  user.username,
    name:      user.name,
    email:     user.email,
    role:      user.role,
    createdAt: user.createdAt,
  };
}

export const AuthService = {
  // ── Local auth ──────────────────────────────────────────────────────────

  async login(username: string, password: string): Promise<SafeUser> {
    const identity = await db.identity.findUnique({
      where: { provider_providerId: { provider: "local", providerId: username } },
      include: { user: true },
    });
    if (!identity) throw new UnauthorizedError("Invalid credentials");

    const creds = identity.credentials as { hash?: string };
    if (!creds.hash) throw new UnauthorizedError("Invalid credentials");

    const valid = await bcrypt.compare(password, creds.hash);
    if (!valid) throw new UnauthorizedError("Invalid credentials");

    return toSafeUser(identity.user);
  },

  async register(data: {
    username: string;
    password: string;
    name:     string;
    email?:   string;
  }): Promise<SafeUser> {
    // Check username uniqueness
    const existingUser = await db.user.findUnique({ where: { username: data.username } });
    if (existingUser) throw new ConflictError("Username already taken");

    // Check email uniqueness if provided
    if (data.email) {
      const existingEmail = await db.user.findUnique({ where: { email: data.email } });
      if (existingEmail) throw new ConflictError("Email already in use");
    }

    const hash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create User + local Identity in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: data.username,
          name:     data.name,
          email:    data.email ?? null,
          role:     "user",
        },
      });

      await tx.identity.create({
        data: {
          userId:      newUser.id,
          provider:    "local",
          providerId:  data.username,
          credentials: { hash },
        },
      });

      return newUser;
    });

    return toSafeUser(user);
  },

  // ── OAuth (Google / Telegram / GitHub) ─────────────────────────────────
  // Called by each OAuth strategy callback.

  async findOrCreateOAuth(data: {
    provider:   string;                // 'google' | 'telegram' | 'github'
    providerId: string;                // unique ID from the provider
    name:       string;
    email?:     string;
    credentials?: Record<string, unknown>;
  }): Promise<SafeUser> {
    // Try to find an existing identity for this provider
    const existing = await db.identity.findUnique({
      where: { provider_providerId: { provider: data.provider, providerId: data.providerId } },
      include: { user: true },
    });

    if (existing) {
      // Update credentials (e.g. refreshed access token)
      if (data.credentials) {
        await db.identity.update({
          where: { id: existing.id },
          data:  { credentials: data.credentials as any },
        });
      }
      return toSafeUser(existing.user);
    }

    // Check if a user with the same email exists (link accounts)
    let user = data.email
      ? await db.user.findUnique({ where: { email: data.email } })
      : null;

    if (!user) {
      user = await db.user.create({
        data: {
          name:  data.name,
          email: data.email ?? null,
          role:  "user",
        },
      });
    }

    await db.identity.create({
      data: {
        userId:      user.id,
        provider:    data.provider,
        providerId:  data.providerId,
        credentials: (data.credentials ?? {}) as any,
      },
    });

    return toSafeUser(user);
  },

  // ── Profile ─────────────────────────────────────────────────────────────

  async getById(id: number): Promise<SafeUser | null> {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return null;
    return toSafeUser(user);
  },

  async updateProfile(id: number, data: { name?: string; email?: string }): Promise<SafeUser> {
    if (data.email) {
      const conflict = await db.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (conflict) throw new ConflictError("Email already in use");
    }
    const user = await db.user.update({ where: { id }, data });
    return toSafeUser(user);
  },

  /** List all linked providers for a user (useful for account settings UI) */
  async getIdentities(userId: number) {
    return db.identity.findMany({
      where: { userId },
      select: { id: true, provider: true, providerId: true, createdAt: true },
    });
  },
};
