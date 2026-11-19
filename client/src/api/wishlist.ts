import { api, buildUrl } from "@shared/routes";
import { apiFetch, apiRequest } from "./http";

export async function fetchWishlist(): Promise<number[]> {
  const res = await apiFetch(api.wishlist.list.path);
  if (!res.ok) throw new Error("Failed to fetch wishlist");
  return res.json();
}

export async function addWishlistItem(productId: number): Promise<Response> {
  const url = buildUrl(api.wishlist.add.path, { productId });
  return apiRequest(api.wishlist.add.method, url);
}

export async function removeWishlistItem(productId: number): Promise<Response> {
  const url = buildUrl(api.wishlist.remove.path, { productId });
  return apiRequest(api.wishlist.remove.method, url);
}

export async function clearWishlist(): Promise<Response> {
  return apiRequest(api.wishlist.clear.method, api.wishlist.clear.path);
}

export async function syncWishlist(productIds: number[]): Promise<void> {
  await apiFetch(api.wishlist.sync.path, {
    method: api.wishlist.sync.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIds }),
  });
}
