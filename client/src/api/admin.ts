import { apiFetch, apiRequest } from "./http";
import type { AdminOrder } from "@shared/schema";

export type AdminStats = {
  productCount: number;
  userCount: number;
  orderCount: number;
  reviewCount: number;
  totalInventoryValue: number;
  lowStock: number;
  outOfStock: number;
};

export type AdminUser = {
  id: number;
  username: string;
  name: string;
  role: string;
};

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await apiFetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await apiFetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const res = await apiFetch("/api/admin/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function updateAdminProduct(
  id: number,
  values: { stock?: number; price?: number },
) {
  const res = await apiRequest("PATCH", `/api/admin/products/${id}`, values);
  return res.json();
}

export async function updateAdminOrderStatus(
  id: number,
  status: string,
): Promise<AdminOrder> {
  const res = await apiRequest("PATCH", `/api/admin/orders/${id}/status`, { status });
  return res.json();
}
