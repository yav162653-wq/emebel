import { api, buildUrl } from "@shared/routes";
import { apiFetchJson, apiRequest, apiRequestJson } from "./http";

export async function fetchWishlist(): Promise<number[]> {
  return apiFetchJson(api.wishlist.list.path, api.wishlist.list.responses[200]);
}

export async function addWishlistItem(productId: number): Promise<void> {
  const url = buildUrl(api.wishlist.add.path, { productId });
  await apiRequest(api.wishlist.add.method, url);
}

export async function removeWishlistItem(productId: number): Promise<void> {
  const url = buildUrl(api.wishlist.remove.path, { productId });
  await apiRequest(api.wishlist.remove.method, url);
}

export async function clearWishlist(): Promise<void> {
  await apiRequest(api.wishlist.clear.method, api.wishlist.clear.path);
}

export async function syncWishlist(productIds: number[]): Promise<number[]> {
  const input = api.wishlist.sync.input.parse({ productIds });
  return apiRequestJson(
    api.wishlist.sync.method,
    api.wishlist.sync.path,
    input,
    api.wishlist.sync.responses[200],
  );
}
