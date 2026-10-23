import type { IdentityProvider } from "../../../../packages/contracts/src";

export interface IdentityAccount {
  id: number;
  username: string | null;
  name: string;
  email: string | null;
  emailVerifiedAt: Date | null;
  role: string;
  createdAt: Date;
  memberships: IdentityMembership[];
}

export interface IdentityMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  plan: string;
  role: string;
  status: string;
}

export interface StoredIdentity {
  id: number;
  userId: number;
  provider: IdentityProvider | string;
  providerId: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface StoredAuthToken {
  id: string;
  userId: number | null;
  email: string | null;
  type: string;
  expiresAt: Date;
}

export interface IdentityRepository {
  findUserById(id: number): Promise<IdentityAccount | null>;
  findUserByUsername(username: string): Promise<IdentityAccount | null>;
  findUserByEmail(email: string): Promise<IdentityAccount | null>;
  findIdentity(provider: string, providerId: string): Promise<StoredIdentity | null>;
  findIdentityForUser(userId: number, provider: string): Promise<StoredIdentity | null>;
  findLocalPasswordHash(username: string): Promise<string | null>;
  ensurePersonalWorkspace(userId: number): Promise<void>;
  createLocalAccount(input: {
    username: string;
    name: string;
    email: string | null;
    passwordHash: string;
  }): Promise<IdentityAccount>;
  createEmailAccount(input: { email: string }): Promise<IdentityAccount>;
  createExternalAccount(input: {
    provider: Exclude<IdentityProvider, "local" | "email">;
    providerId: string;
    name: string;
    email: string | null;
    emailVerified: boolean;
    credentials: Record<string, unknown>;
  }): Promise<IdentityAccount>;
  addIdentity(input: {
    userId: number;
    provider: string;
    providerId: string;
    credentials?: Record<string, unknown>;
  }): Promise<StoredIdentity>;
  touchIdentity(id: number, credentials?: Record<string, unknown>): Promise<void>;
  updateProfile(id: number, input: { name?: string; email?: string }): Promise<IdentityAccount>;
  markEmailVerified(id: number, email: string): Promise<IdentityAccount>;
  listIdentities(userId: number): Promise<StoredIdentity[]>;
  createAuthToken(input: {
    userId: number | null;
    email: string | null;
    type: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  consumeAuthToken(tokenHash: string, type: string, now: Date): Promise<StoredAuthToken | null>;
}