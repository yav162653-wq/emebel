import { apiFetch } from "./http";

export type PublicStats = {
  productCount: number;
  reviewCount: number;
  orderCount: number;
};

export async function fetchPublicStats(): Promise<PublicStats> {
  const res = await apiFetch("/api/stats");
  if (!res.ok) return { productCount: 0, reviewCount: 0, orderCount: 0 };
  return res.json();
}
