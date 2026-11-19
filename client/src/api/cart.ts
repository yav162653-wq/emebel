import { api, buildUrl, type CartListResponse } from "@shared/routes";
import { apiFetch, apiRequest } from "./http";

export type AddCartItemInput = {
  productId: number;
  quantity?: number;
};

export type UpdateCartItemInput = {
  id: number;
  quantity: number;
};

export async function fetchCart(): Promise<CartListResponse> {
  const res = await apiFetch(api.cart.list.path);
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error("Failed to fetch cart");
  }
  return await res.json() as CartListResponse;
}

export async function addCartItem({ productId, quantity }: AddCartItemInput) {
  const res = await apiRequest("POST", api.cart.add.path, {
    productId,
    quantity: quantity ?? 1,
  });
  return res.json();
}

export async function updateCartItem({ id, quantity }: UpdateCartItemInput) {
  const url = buildUrl(api.cart.update.path, { id });
  const res = await apiRequest(api.cart.update.method, url, { quantity });
  if (res.status === 204) return null;
  return res.json();
}

export async function removeCartItem(id: number): Promise<void> {
  const url = buildUrl(api.cart.remove.path, { id });
  await apiRequest(api.cart.remove.method, url);
}
