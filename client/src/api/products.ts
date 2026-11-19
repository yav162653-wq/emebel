import {
  api,
  buildUrl,
  type Product,
  type ProductListQuery,
  type ProductListResponse,
} from "@shared/routes";
import { apiFetch, apiFetchJson, apiResponseJson } from "./http";

export async function fetchFurnitureCollection(
  input: Partial<ProductListQuery> = {},
): Promise<ProductListResponse> {
  const query = api.products.list.query.parse(input);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetchJson(
    `${api.products.list.path}?${params}`,
    api.products.list.responses[200],
  );
}

export async function fetchFurnitureItem(id: number): Promise<Product | null> {
  const url = buildUrl(api.products.get.path, { id });
  const res = await apiFetch(url);
  if (res.status === 404) return null;
  return apiResponseJson(res, api.products.get.responses[200]);
}
