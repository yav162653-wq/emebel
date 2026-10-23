import {
  emailSchema,
  externalIdentitySchema,
  loginSchema,
  profileSchema,
  publicIdentitySchema,
  publicUserSchema,
  registerSchema,
  tokenSchema,
} from "../../api-zod/src";

export const authApiSpec = {
  login: {
    method: "POST" as const,
    path: "/api/auth/login",
    input: loginSchema,
    response: publicUserSchema,
  },
  register: {
    method: "POST" as const,
    path: "/api/auth/register",
    input: registerSchema,
    response: publicUserSchema,
  },
  magicLinkRequest: {
    method: "POST" as const,
    path: "/api/auth/magic-link/request",
    input: emailSchema,
  },
  magicLinkConsume: {
    method: "POST" as const,
    path: "/api/auth/magic-link/consume",
    input: tokenSchema,
    response: publicUserSchema,
  },
  accountLinkRequest: {
    method: "POST" as const,
    path: "/api/auth/account-link/request",
    input: emailSchema,
  },
  accountLinkConsume: {
    method: "POST" as const,
    path: "/api/auth/account-link/consume",
    input: tokenSchema,
    response: publicUserSchema,
  },
  me: {
    method: "GET" as const,
    path: "/api/auth/me",
    response: publicUserSchema,
  },
  profile: {
    method: "PATCH" as const,
    path: "/api/auth/profile",
    input: profileSchema,
    response: publicUserSchema,
  },
  identities: {
    method: "GET" as const,
    path: "/api/auth/identities",
    response: publicIdentitySchema.array(),
  },
};

export * from "../../api-zod/src";