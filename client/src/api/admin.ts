import { api, buildUrl, type AdminOrder, type AdminStatsResponse, type AdminUserResponse, type OrderStatus, type Product } from "@shared/routes";
import { apiFetchJson, apiRequestJson } from "./http";

export type AdminStats = AdminStatsResponse;
export type AdminUser = AdminUserResponse;

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiFetchJson(api.admin.stats.path, api.admin.stats.responses[200]);
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  return apiFetchJson(api.admin.users.path, api.admin.users.responses[200]);
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  return apiFetchJson(api.admin.orders.path, api.admin.orders.responses[200]);
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
