import { apiSpec } from "../lib/api-spec/src";
import { apiErrorSchema } from "../lib/api-zod/src";

export type {
  AdminOrder,
  AdminOrderListResponse,
  AuthResponse,
  CartItem,
  CartListResponse,
  InsertCartItem,
  InsertProduct,
  InsertUser,
  LoginRequest,
  Order,
  OrderItem,
  OrderListResponse,
  Product,
  ProductListResponse,
  ProductResponse,
  Review,
  ReviewListResponse,
  ReviewSummary,
  User,
} from "./schema";

export type {
  CreateOrderHeaders,
  AdminStatsResponse,
  AdminListQuery,
  AdminOrderListQuery,
  AdminUserListResponse,
  AdminUserResponse,
  LatestReviewResponse,
  CsrfTokenResponse,
  IdempotencyKey,
  HealthResponse,
  OrderStatus,
  ProductListQuery,
  PublicIdentity,
  PublicStatsResponse,
  PublicUser,
  ReadyResponse,
  RegisterRequest,
  ReviewBaseResponse,
  ReviewListQuery,
  ShopifyCheckoutInput,
  ShopifyCheckoutResponse,
  UserProfileUpdate,
  UserRole,
} from "../lib/api-zod/src";

export const api = apiSpec;
export {
  apiErrorSchema,
  csrfTokenResponseSchema,
  userRoleSchema,
} from "../lib/api-zod/src";

export const errorSchemas = {
  validation: apiErrorSchema,
  notFound: apiErrorSchema,
  internal: apiErrorSchema,
  unauthorized: apiErrorSchema,
  forbidden: apiErrorSchema,
  conflict: apiErrorSchema,
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
