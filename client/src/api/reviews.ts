import { apiFetch, apiRequest } from "./http";
import type { Review, ReviewSummary } from "@shared/schema";

export async function fetchReviewSummary(productId: number): Promise<ReviewSummary> {
  const res = await apiFetch(`/api/reviews/${productId}/summary`);
  return res.json();
}

export async function fetchReviews(productId: number): Promise<Review[]> {
  const res = await apiFetch(`/api/reviews/${productId}`);
  return res.json();
}

export async function fetchMyReview(productId: number): Promise<Review | null> {
  const res = await apiFetch(`/api/reviews/${productId}/mine`);
  if (!res.ok) return null;
  return res.json();
}

export async function submitReview(
  productId: number,
  rating: number,
  body?: string,
): Promise<Review> {
  const res = await apiRequest("POST", `/api/reviews/${productId}`, {
    rating,
    body,
  });
  return res.json();
}

export type LatestReview = Review & {
  product: { id: number; name: string };
};

export async function fetchLatestReviews(limit = 3): Promise<LatestReview[]> {
  const res = await apiFetch(`/api/reviews/latest?limit=${limit}`);
  if (!res.ok) return [];
  return res.json();
}
