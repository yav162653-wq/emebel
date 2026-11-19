import { z } from "zod";
import { authApiSpec } from "../lib/api-spec/src";

export type {
  LoginRequest,
  InsertUser,
  User,
  Product,
  CartItem,
  InsertProduct,
  CartListResponse,
  ProductListResponse,
} from "./schema";

export const errorSchemas = {
  validation:   z.object({ message: z.string(), field: z.string().optional() }),
  notFound:     z.object({ message: z.string() }),
  internal:     z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      ...authApiSpec.login,
      responses: {
        200: authApiSpec.login.response,
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method:    "POST" as const,
      path:      "/api/auth/logout",
      responses: { 200: z.void() },
    },
    me: {
      ...authApiSpec.me,
      responses: {
        200: authApiSpec.me.response,
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      ...authApiSpec.register,
      responses: {
        201: authApiSpec.register.response,
        400: errorSchemas.validation,
      },
    },
    magicLinkRequest: {
      ...authApiSpec.magicLinkRequest,
      responses: { 202: z.object({ message: z.string() }) },
    },
    magicLinkConsume: {
      ...authApiSpec.magicLinkConsume,
      responses: { 200: authApiSpec.magicLinkConsume.response },
    },
    accountLinkRequest: {
      ...authApiSpec.accountLinkRequest,
      responses: { 202: z.object({ message: z.string() }) },
    },
    accountLinkConsume: {
      ...authApiSpec.accountLinkConsume,
      responses: { 200: authApiSpec.accountLinkConsume.response },
    },
  },
  products: {
    list: {
      method:    "GET" as const,
      path:      "/api/products",
      responses: { 200: z.array(z.unknown()) },
    },
    get: {
      method:    "GET" as const,
      path:      "/api/products/:id",
      responses: { 200: z.unknown(), 404: errorSchemas.notFound },
    },
  },
  cart: {
    list: {
      method:    "GET" as const,
      path:      "/api/cart",
      responses: { 200: z.array(z.unknown()) },
    },
    add: {
      method:    "POST" as const,
      path:      "/api/cart",
      input:     z.object({ productId: z.number(), quantity: z.number().default(1) }),
      responses: { 200: z.unknown() },
    },
    update: {
      method:    "PATCH" as const,
      path:      "/api/cart/:id",
      input:     z.object({ quantity: z.number().int().min(0) }),
      responses: { 200: z.unknown(), 204: z.void() },
    },
    remove: {
      method:    "DELETE" as const,
      path:      "/api/cart/:id",
      responses: { 204: z.void() },
    },
  },
  wishlist: {
    list: {
      method:    "GET" as const,
      path:      "/api/wishlist",
      responses: { 200: z.array(z.number()) },
    },
    add: {
      method:    "POST" as const,
      path:      "/api/wishlist/:productId",
      responses: { 204: z.void() },
    },
    remove: {
      method:    "DELETE" as const,
      path:      "/api/wishlist/:productId",
      responses: { 204: z.void() },
    },
    clear: {
      method:    "DELETE" as const,
      path:      "/api/wishlist",
      responses: { 204: z.void() },
    },
    sync: {
      method:    "POST" as const,
      path:      "/api/wishlist/sync",
      input:     z.object({ productIds: z.array(z.number().int().positive()) }),
      responses: { 200: z.array(z.number()) },
    },
  },
} as const;

export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
