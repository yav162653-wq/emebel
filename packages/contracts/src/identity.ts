export type IdentityProvider =
  | "local"
  | "email"
  | "google"
  | "github"
  | "telegram";

export interface WorkspaceMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  plan: string;
  role: string;
  status: string;
}

export interface PublicUser {
  id: number;
  username: string | null;
  name: string;
  email: string | null;
  emailVerified: boolean;
  role: string;
  createdAt: string;
  workspaces: WorkspaceMembership[];
}

export interface PublicIdentity {
  id: number;
  provider: IdentityProvider | string;
  providerId: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ExternalIdentityProfile {
  provider: Exclude<IdentityProvider, "local" | "email">;
  providerId: string;
  name: string;
  email?: string;
  emailVerified: boolean;
  credentials?: Record<string, unknown>;
}