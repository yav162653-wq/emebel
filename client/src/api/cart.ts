import { api, buildUrl, type CartListResponse } from "@shared/routes";
import { apiFetchJson, apiRequest, apiRequestJson, apiResponseJson } from "./http";
import type { CartItem } from "@shared/routes";

export type AddCartItemInput = {
  productId: number;
  quantity?: number;
};

export type UpdateCartItemInput = {
  id: number;
  quantity: number;
};

export async function fetchCart(): Promise<CartListResponse> {
  return apiFetchJson(api.cart.list.path, api.cart.list.responses[200]);
}

export async function addCartItem({ productId, quantity }: AddCartItemInput): Promise<CartItem> {
  const input = api.cart.add.input.parse({ productId, quantity });
  return apiRequestJson(
    api.cart.add.method,
    api.cart.add.path,
    input,
    api.cart.add.responses[200],
  );
}

export async function updateCartItem({ id, quantity }: UpdateCartItemInput): Promise<CartItem | null> {
  const url = buildUrl(api.cart.update.path, { id });
  const res = await apiRequest(api.cart.update.method, url, { quantity });
  if (res.status === 204) return null;
  return apiResponseJson(res, api.cart.update.responses[200]);
}

export async function removeCartItem(id: number): Promise<void> {
  const url = buildUrl(api.cart.remove.path, { id });
  await apiRequest(api.cart.remove.method, url);
}

export async function clearCart(): Promise<void> {
  await apiRequest(api.cart.clear.method, api.cart.clear.path);
}
