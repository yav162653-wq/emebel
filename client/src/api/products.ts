import { api, buildUrl, type Product } from "@shared/routes";
import { apiFetch, apiFetchJson, apiResponseJson } from "./http";

export async function fetchFurnitureCollection(limit?: number): Promise<Product[]> {
  const parsedLimit = limit === undefined
    ? undefined
    : api.products.list.query.parse({ limit }).limit;
  const url = parsedLimit === undefined
    ? api.products.list.path
    : `${api.products.list.path}?${new URLSearchParams({ limit: String(parsedLimit) })}`;
  return apiFetchJson(url, api.products.list.responses[200]);
}

export async function fetchFurnitureItem(id: number): Promise<Product | null> {
  const url = buildUrl(api.products.get.path, { id });
  const res = await apiFetch(url);
  if (res.status === 404) return null;
  return apiResponseJson(res, api.products.get.responses[200]);
}
