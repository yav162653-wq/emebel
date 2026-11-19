import { api, buildUrl, type Product } from "@shared/routes";
import { apiFetch, apiFetchJson, apiResponseJson } from "./http";

export async function fetchFurnitureCollection(): Promise<Product[]> {
  return apiFetchJson(api.products.list.path, api.products.list.responses[200]);
}

export async function fetchFurnitureItem(id: number): Promise<Product | null> {
  const url = buildUrl(api.products.get.path, { id });
  const res = await apiFetch(url);
  if (res.status === 404) return null;
  return apiResponseJson(res, api.products.get.responses[200]);
}
