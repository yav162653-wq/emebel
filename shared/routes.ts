import { z } from "zod";
import { insertUserSchema, insertCartItemSchema } from "./schema";

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
      method:    "POST" as const,
      path:      "/api/auth/login",
      input:     z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ id: z.number(), username: z.string(), name: z.string(), role: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method:    "POST" as const,
      path:      "/api/auth/logout",
      responses: { 200: z.void() },
    },
    me: {
      method:    "GET" as const,
      path:      "/api/auth/me",
      responses: {
        200: z.object({ id: z.number(), username: z.string(), name: z.string(), role: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      method:    "POST" as const,
      path:      "/api/auth/register",
      input:     insertUserSchema,
      responses: {
        201: z.object({ id: z.number(), username: z.string(), name: z.string(), role: z.string() }),
        400: errorSchemas.validation,
      },
    },
  },
  products: {
    list: {
      method:    "GET" as const,
      path:      "/api/products",
      responses: { 200: z.array(z.any()) },
    },
    get: {
      method:    "GET" as const,
      path:      "/api/products/:id",
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
  },
  cart: {
    list: {
      method:    "GET" as const,
      path:      "/api/cart",
      responses: { 200: z.array(z.any()) },
    },
    add: {
      method:    "POST" as const,
      path:      "/api/cart",
      input:     z.object({ productId: z.number(), quantity: z.number().default(1) }),
      responses: { 200: z.any() },
    },
    remove: {
      method:    "DELETE" as const,
      path:      "/api/cart/:id",
      responses: { 204: z.void() },
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
