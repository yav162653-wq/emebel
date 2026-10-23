import { z } from "zod";

export const publicUserSchema = z.object({
  id: z.number(),
  username: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean(),
  role: z.string(),
  createdAt: z.string(),
  workspaces: z.array(
    z.object({
      id: z.string(),
      organizationId: z.string(),
      organizationName: z.string(),
      organizationSlug: z.string(),
      plan: z.string(),
      role: z.string(),
      status: z.string(),
    }),
  ),
});

export const publicIdentitySchema = z.object({
  id: z.number(),
  provider: z.string(),
  providerId: z.string(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(100),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email().optional(),
  ),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().optional(),
});

export const emailSchema = z.object({
  email: z.string().trim().email(),
});

export const tokenSchema = z.object({
  token: z.string().trim().min(32).max(256),
});

export const externalIdentitySchema = z.object({
  provider: z.enum(["google", "github", "telegram"]),
  providerId: z.string().min(1).max(255),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().optional(),
  emailVerified: z.boolean(),
  credentials: z.record(z.unknown()).optional(),
});