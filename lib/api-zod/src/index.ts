import { z } from "zod";

export const publicUserSchema = z.object({
  id: z.number().int().positive(),
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
  id: z.number().int().positive(),
  provider: z.string(),
  providerId: z.string(),
  createdAt: z.string().datetime(),
  lastUsedAt: z.string().datetime().nullable(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().optional()
    .transform((value) => value === "" ? undefined : value)
    .pipe(z.string().email().optional()),
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

export const csrfTokenResponseSchema = z.object({
  token: z.string().min(1),
});

export const externalIdentitySchema = z.object({
  provider: z.enum(["google", "github", "telegram"]),
  providerId: z.string().min(1).max(255),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().optional(),
  emailVerified: z.boolean(),
  credentials: z.record(z.string(), z.unknown()).optional(),
});

export const idParamSchema = z.coerce.number().int().positive();

export const productListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const productResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string(),
  price: z.number().int(),
  category: z.string(),
  image: z.string(),
  stock: z.number().int(),
  material: z.string(),
  warranty: z.string(),
  origin: z.string(),
  assembly: z.string(),
  colors: z.array(z.string()),
});

export const cartAddSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

export const cartUpdateSchema = z.object({
  quantity: z.number().int().min(0),
});

export const cartItemResponseSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const cartListResponseSchema = z.array(
  cartItemResponseSchema.extend({ product: productResponseSchema }),
);

export const wishlistSyncSchema = z.object({
  productIds: z.array(z.number().int().positive()),
});

export const orderItemResponseSchema = z.object({
  id: z.number().int().positive(),
  orderId: z.number().int().positive(),
  productId: z.number().int().positive(),
  name: z.string(),
  price: z.number().int(),
  quantity: z.number().int().positive(),
  image: z.string(),
});

export const orderResponseSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  total: z.number().int(),
  status: z.string(),
  address: z.string(),
  createdAt: z.string().datetime(),
  items: z.array(orderItemResponseSchema),
});

export const createOrderSchema = z.object({
  address: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive().max(50),
    }),
  ).min(1),
});

export const orderListEntryResponseSchema = orderResponseSchema.extend({
  items: z.array(
    z.object({
      id: z.number().int().positive(),
      name: z.string(),
      price: z.number().int(),
      quantity: z.number().int().positive(),
      image: z.string(),
    }),
  ),
});

export const orderListResponseSchema = z.array(orderListEntryResponseSchema);

export const adminOrderResponseSchema = orderResponseSchema.extend({
  user: z.object({
    id: z.number().int().positive(),
    username: z.string().nullable(),
    name: z.string(),
  }),
});

export const adminStatsResponseSchema = z.object({
  productCount: z.number().int().nonnegative(),
  userCount: z.number().int().nonnegative(),
  orderCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  totalInventoryValue: z.number(),
  lowStock: z.number().int().nonnegative(),
  outOfStock: z.number().int().nonnegative(),
});

export const adminUserResponseSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().nullable(),
  name: z.string(),
  role: z.string(),
});

export const adminProductUpdateSchema = z.object({
  stock: z.number().int().min(0).optional(),
  price: z.number().int().positive().optional(),
});

export const orderStatusSchema = z.enum(["Processing", "Shipped", "Delivered"]);
export const adminOrderStatusUpdateSchema = z.object({ status: orderStatusSchema });

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
});

export const latestReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().default(3),
}).transform(({ limit }) => ({ limit: Math.min(limit, 10) }));

export const reviewSummaryResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  average: z.number().min(0).max(5),
});

export const reviewBaseResponseSchema = z.object({
  id: z.number().int().positive(),
  productId: z.number().int().positive(),
  userId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  body: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const reviewResponseSchema = reviewBaseResponseSchema.extend({
  user: z.object({
    id: z.number().int().positive(),
    name: z.string(),
    username: z.string().nullable(),
  }),
});

export const latestReviewResponseSchema = reviewResponseSchema.extend({
  product: z.object({
    id: z.number().int().positive(),
    name: z.string(),
  }),
});

export const publicStatsResponseSchema = z.object({
  productCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  orderCount: z.number().int().nonnegative(),
});

export const newsletterSubscribeSchema = z.object({
  email: z.string().email("Valid email required"),
});

export const newsletterResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});

const checkoutItemsSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive().max(50),
    }),
  ).min(1).max(50),
});

export const shopifyCheckoutSchema = checkoutItemsSchema.extend({
  email: z.string().email().optional(),
});

export const shopifyCheckoutResponseSchema = z.object({
  checkoutUrl: z.string().url(),
});

export const externalProvidersResponseSchema = z.object({
  providers: z.array(z.enum(["google", "github", "telegram"])),
});

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  requestId: z.string(),
  errors: z.array(
    z.object({ field: z.string(), message: z.string() }),
  ).optional(),
});

export const okResponseSchema = z.object({ ok: z.literal(true) });

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  env: z.string(),
  timestamp: z.string().datetime(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;
export type PublicIdentity = z.infer<typeof publicIdentitySchema>;
export type LoginRequest = z.input<typeof loginSchema>;
export type CsrfTokenResponse = z.infer<typeof csrfTokenResponseSchema>;
export type RegisterRequest = z.input<typeof registerSchema>;
export type UserProfileUpdate = z.input<typeof profileSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
export type CartItemResponse = z.infer<typeof cartItemResponseSchema>;
export type CartListResponse = z.infer<typeof cartListResponseSchema>;
export type OrderResponse = z.infer<typeof orderResponseSchema>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
export type AdminOrderResponse = z.infer<typeof adminOrderResponseSchema>;
export type AdminStatsResponse = z.infer<typeof adminStatsResponseSchema>;
export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;
export type ReviewBaseResponse = z.infer<typeof reviewBaseResponseSchema>;
export type LatestReviewResponse = z.infer<typeof latestReviewResponseSchema>;
export type ReviewSummaryResponse = z.infer<typeof reviewSummaryResponseSchema>;
export type PublicStatsResponse = z.infer<typeof publicStatsResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type NewsletterResponse = z.infer<typeof newsletterResponseSchema>;
export type ShopifyCheckoutInput = z.input<typeof shopifyCheckoutSchema>;
export type ShopifyCheckoutResponse = z.infer<typeof shopifyCheckoutResponseSchema>;