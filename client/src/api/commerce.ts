import { apiFetch, apiRequest } from "./http";
import type { OrderListResponse } from "@shared/schema";

export async function fetchMyOrders(): Promise<OrderListResponse> {
  const res = await apiFetch("/api/orders/my");
  if (!res.ok) return [];
  return res.json();
}

export type ShopifyCheckoutInput = {
  email?: string;
  items: Array<{ productId: number; quantity: number }>;
};

export async function createShopifyCheckout(
  input: ShopifyCheckoutInput,
): Promise<{ checkoutUrl: string }> {
  const res = await apiRequest("POST", "/api/shopify/checkout", input);
  return res.json();
}
