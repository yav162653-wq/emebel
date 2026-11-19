import { api, buildUrl, type Product } from "@shared/routes";
import { apiFetch } from "./http";

export async function fetchFurnitureCollection(): Promise<Product[]> {
  const res = await apiFetch(api.products.list.path);
  if (!res.ok) throw new Error("Failed to fetch furniture collection");
  return await res.json() as Product[];
}

export async function fetchFurnitureItem(id: number): Promise<Product | null> {
  const res = await apiFetch(buildUrl(api.products.get.path, { id }));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch item details");
  return await res.json() as Product;
}
