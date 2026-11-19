import {
  adminOrderResponseSchema,
  adminOrderStatusUpdateSchema,
  adminProductUpdateSchema,
  adminStatsResponseSchema,
  adminUserResponseSchema,
  apiErrorSchema,
  cartAddSchema,
  cartItemResponseSchema,
  cartListResponseSchema,
  cartUpdateSchema,
  csrfTokenResponseSchema,
  createOrderSchema,
  emailSchema,
  externalProvidersResponseSchema,
  healthResponseSchema,
  idParamSchema,
  latestReviewResponseSchema,
  latestReviewsQuerySchema,
  loginSchema,
  newsletterResponseSchema,
  newsletterSubscribeSchema,
  okResponseSchema,
  orderListResponseSchema,
  orderResponseSchema,
  productListQuerySchema,
  productResponseSchema,
  profileSchema,
  publicIdentitySchema,
  publicStatsResponseSchema,
  publicUserSchema,
  registerSchema,
  reviewBaseResponseSchema,
  reviewInputSchema,
  reviewResponseSchema,
  reviewSummaryResponseSchema,
  shopifyCheckoutResponseSchema,
  shopifyCheckoutSchema,
  tokenSchema,
  wishlistSyncSchema,
} from "../../api-zod/src";
import { z } from "zod";

const authenticated = { 401: apiErrorSchema };

export const apiSpec = {
  health: {
    get: {
      method: "GET" as const,
      path: "/api/health",
      responses: { 200: healthResponseSchema },
    },
  },
  csrf: {
    token: {
      method: "GET" as const,
      path: "/api/csrf-token",
      responses: { 200: csrfTokenResponseSchema },
    },
  },
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/auth/login",
      input: loginSchema,
      responses: { 200: publicUserSchema, 400: apiErrorSchema, 401: apiErrorSchema },
    },
    register: {
      method: "POST" as const,
      path: "/api/auth/register",
      input: registerSchema,
      responses: { 201: publicUserSchema, 400: apiErrorSchema, 409: apiErrorSchema },
    },
    logout: {
      method: "POST" as const,
      path: "/api/auth/logout",
      responses: { 200: z.string() },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me",
      responses: { 200: publicUserSchema, 401: apiErrorSchema },
    },
    profile: {
      method: "PATCH" as const,
      path: "/api/auth/profile",
      input: profileSchema,
      responses: { 200: publicUserSchema, 400: apiErrorSchema, 401: apiErrorSchema, 409: apiErrorSchema },
    },
    identities: {
      method: "GET" as const,
      path: "/api/auth/identities",
      responses: { 200: z.array(publicIdentitySchema), 401: apiErrorSchema },
    },
    magicLinkRequest: {
      method: "POST" as const,
      path: "/api/auth/magic-link/request",
      input: emailSchema,
      responses: { 202: z.object({ message: z.string() }), 400: apiErrorSchema, 503: apiErrorSchema },
    },
    magicLinkConsume: {
      method: "POST" as const,
      path: "/api/auth/magic-link/consume",
      input: tokenSchema,
      responses: { 200: publicUserSchema, 400: apiErrorSchema, 404: apiErrorSchema },
    },
    accountLinkRequest: {
      method: "POST" as const,
      path: "/api/auth/account-link/request",
      input: emailSchema,
      responses: { 202: z.object({ message: z.string() }), 400: apiErrorSchema, 401: apiErrorSchema, 409: apiErrorSchema },
    },
    accountLinkConsume: {
      method: "POST" as const,
      path: "/api/auth/account-link/consume",
      input: tokenSchema,
      responses: { 200: publicUserSchema, 400: apiErrorSchema, 409: apiErrorSchema },
    },
    externalProviders: {
      method: "GET" as const,
      path: "/api/auth/external/providers",
      responses: { 200: externalProvidersResponseSchema },
    },
    externalStart: {
      method: "GET" as const,
      path: "/api/auth/external/:provider",
      params: z.object({ provider: z.enum(["google", "github", "telegram"]) }),
      responses: { 302: z.string(), 400: apiErrorSchema, 503: apiErrorSchema },
    },
    externalLinkStart: {
      method: "GET" as const,
      path: "/api/auth/external/:provider/link",
      params: z.object({ provider: z.enum(["google", "github", "telegram"]) }),
      responses: { 302: z.string(), 401: apiErrorSchema, 400: apiErrorSchema, 503: apiErrorSchema },
    },
    externalCallback: {
      method: "GET" as const,
      path: "/api/auth/external/:provider/callback",
      params: z.object({ provider: z.enum(["google", "github", "telegram"]) }),
      responses: { 302: z.string() },
    },
  },
  products: {
    list: {
      method: "GET" as const,
      path: "/api/products",
      query: productListQuerySchema,
      responses: { 200: z.array(productResponseSchema), 400: apiErrorSchema },
    },
    get: {
      method: "GET" as const,
      path: "/api/products/:id",
      params: z.object({ id: idParamSchema }),
      responses: { 200: productResponseSchema, 400: apiErrorSchema, 404: apiErrorSchema },
    },
  },
  cart: {
    list: {
      method: "GET" as const,
      path: "/api/cart",
      responses: { 200: cartListResponseSchema, ...authenticated },
    },
    add: {
      method: "POST" as const,
      path: "/api/cart",
      input: cartAddSchema,
      responses: { 200: cartItemResponseSchema, 400: apiErrorSchema, 401: apiErrorSchema, 404: apiErrorSchema },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/cart/:id",
      params: z.object({ id: idParamSchema }),
      input: cartUpdateSchema,
      responses: { 200: cartItemResponseSchema, 204: z.void(), 400: apiErrorSchema, 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema },
    },
    remove: {
      method: "DELETE" as const,
      path: "/api/cart/:id",
      params: z.object({ id: idParamSchema }),
      responses: { 204: z.void(), 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema },
    },
    clear: {
      method: "DELETE" as const,
      path: "/api/cart",
      responses: { 204: z.void(), ...authenticated },
    },
  },
  wishlist: {
    list: {
      method: "GET" as const,
      path: "/api/wishlist",
      responses: { 200: z.array(z.number().int().positive()), ...authenticated },
    },
    add: {
      method: "POST" as const,
      path: "/api/wishlist/:productId",
      params: z.object({ productId: idParamSchema }),
      responses: { 204: z.void(), 400: apiErrorSchema, 401: apiErrorSchema },
    },
    remove: {
      method: "DELETE" as const,
      path: "/api/wishlist/:productId",
      params: z.object({ productId: idParamSchema }),
      responses: { 204: z.void(), 400: apiErrorSchema, 401: apiErrorSchema },
    },
    clear: {
      method: "DELETE" as const,
      path: "/api/wishlist",
      responses: { 204: z.void(), ...authenticated },
    },
    sync: {
      method: "POST" as const,
      path: "/api/wishlist/sync",
      input: wishlistSyncSchema,
      responses: { 200: z.array(z.number().int().positive()), 400: apiErrorSchema, 401: apiErrorSchema },
    },
  },
  orders: {
    create: {
      method: "POST" as const,
      path: "/api/orders",
      input: createOrderSchema,
      responses: { 201: orderResponseSchema, 400: apiErrorSchema, 401: apiErrorSchema },
    },
    list: {
      method: "GET" as const,
      path: "/api/orders/my",
      responses: { 200: orderListResponseSchema, ...authenticated },
    },
    get: {
      method: "GET" as const,
      path: "/api/orders/:id",
      params: z.object({ id: idParamSchema }),
      responses: { 200: orderResponseSchema, 400: apiErrorSchema, 401: apiErrorSchema, 404: apiErrorSchema },
    },
  },
  admin: {
    stats: {
      method: "GET" as const,
      path: "/api/admin/stats",
      responses: { 200: adminStatsResponseSchema, 401: apiErrorSchema, 403: apiErrorSchema },
    },
    users: {
      method: "GET" as const,
      path: "/api/admin/users",
      responses: { 200: z.array(adminUserResponseSchema), 401: apiErrorSchema, 403: apiErrorSchema },
    },
    orders: {
      method: "GET" as const,
      path: "/api/admin/orders",
      responses: { 200: z.array(adminOrderResponseSchema), 401: apiErrorSchema, 403: apiErrorSchema },
    },
    updateProduct: {
      method: "PATCH" as const,
      path: "/api/admin/products/:id",
      params: z.object({ id: idParamSchema }),
      input: adminProductUpdateSchema,
      responses: { 200: productResponseSchema, 400: apiErrorSchema, 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema },
    },
    updateOrderStatus: {
      method: "PATCH" as const,
      path: "/api/admin/orders/:id/status",
      params: z.object({ id: idParamSchema }),
      input: adminOrderStatusUpdateSchema,
      responses: { 200: adminOrderResponseSchema, 400: apiErrorSchema, 401: apiErrorSchema, 403: apiErrorSchema, 404: apiErrorSchema },
    },
  },
  reviews: {
    latest: {
      method: "GET" as const,
      path: "/api/reviews/latest",
      query: latestReviewsQuerySchema,
      responses: { 200: z.array(latestReviewResponseSchema), 400: apiErrorSchema },
    },
    list: {
      method: "GET" as const,
      path: "/api/reviews/:productId",
      params: z.object({ productId: idParamSchema }),
      responses: { 200: z.array(reviewResponseSchema), 400: apiErrorSchema },
    },
    summary: {
      method: "GET" as const,
      path: "/api/reviews/:productId/summary",
      params: z.object({ productId: idParamSchema }),
      responses: { 200: reviewSummaryResponseSchema, 400: apiErrorSchema },
    },
    mine: {
      method: "GET" as const,
      path: "/api/reviews/:productId/mine",
      params: z.object({ productId: idParamSchema }),
      responses: { 200: reviewBaseResponseSchema.nullable(), 400: apiErrorSchema, 401: apiErrorSchema },
    },
    upsert: {
      method: "POST" as const,
      path: "/api/reviews/:productId",
      params: z.object({ productId: idParamSchema }),
      input: reviewInputSchema,
      responses: { 201: reviewResponseSchema, 400: apiErrorSchema, 401: apiErrorSchema },
    },
    remove: {
      method: "DELETE" as const,
      path: "/api/reviews/:productId",
      params: z.object({ productId: idParamSchema }),
      responses: { 200: okResponseSchema, 401: apiErrorSchema },
    },
  },
  stats: {
    get: {
      method: "GET" as const,
      path: "/api/stats",
      responses: { 200: publicStatsResponseSchema },
    },
  },
  newsletter: {
    subscribe: {
      method: "POST" as const,
      path: "/api/newsletter",
      input: newsletterSubscribeSchema,
      responses: { 201: newsletterResponseSchema, 400: apiErrorSchema, 409: apiErrorSchema },
    },
  },
  shopify: {
    checkout: {
      method: "POST" as const,
      path: "/api/shopify/checkout",
      input: shopifyCheckoutSchema,
      responses: { 200: shopifyCheckoutResponseSchema, 400: apiErrorSchema, 401: apiErrorSchema, 409: apiErrorSchema, 502: apiErrorSchema, 503: apiErrorSchema },
    },
  },
} as const;

export const authApiSpec = apiSpec.auth;

export * from "../../api-zod/src";
