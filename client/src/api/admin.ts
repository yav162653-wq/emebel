import {
  api,
  buildUrl,
  type AdminListQuery,
  type AdminOrder,
  type AdminOrderListQuery,
  type AdminOrderListResponse,
  type AdminStatsResponse,
  type AdminUserListResponse,
  type AdminUserResponse,
  type OrderStatus,
  type Product,
} from "@shared/routes";
import { apiFetchJson, apiRequestJson } from "./http";

export type AdminStats = AdminStatsResponse;
export type AdminUser = AdminUserResponse;

function queryUrl(path: string, values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return `${path}?${params}`;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiFetchJson(api.admin.stats.path, api.admin.stats.responses[200]);
}

export async function fetchAdminUsers(
  input: Partial<AdminListQuery> = {},
): Promise<AdminUserListResponse> {
  const query = api.admin.users.query.parse(input);
  const url = queryUrl(api.admin.users.path, query);
  return apiFetchJson(url, api.admin.users.responses[200]);
}

export async function fetchAdminOrders(
  input: Partial<AdminOrderListQuery> = {},
): Promise<AdminOrderListResponse> {
  const query = api.admin.orders.query.parse(input);
  const url = queryUrl(api.admin.orders.path, query);
  return apiFetchJson(url, api.admin.orders.responses[200]);
}

export async function updateAdminProduct(
  id: number,
  values: { stock?: number; price?: number },
): Promise<Product> {
  const url = buildUrl(api.admin.updateProduct.path, { id });
  return apiRequestJson(
    api.admin.updateProduct.method,
    url,
    api.admin.updateProduct.input.parse(values),
    api.admin.updateProduct.responses[200],
  );
}

export async function updateAdminOrderStatus(
  id: number,
  status: OrderStatus,
): Promise<AdminOrder> {
  const url = buildUrl(api.admin.updateOrderStatus.path, { id });
  return apiRequestJson(
    api.admin.updateOrderStatus.method,
    url,
    api.admin.updateOrderStatus.input.parse({ status }),
    api.admin.updateOrderStatus.responses[200],
  );
}
