import {
  api,
  buildUrl,
  type LatestReviewResponse,
  type Review,
  type ReviewBaseResponse,
  type ReviewListQuery,
  type ReviewListResponse,
  type ReviewSummary,
} from "@shared/routes";
import { apiFetchJson, apiRequestJson } from "./http";

export async function fetchReviewSummary(productId: number): Promise<ReviewSummary> {
  const url = buildUrl(api.reviews.summary.path, { productId });
  return apiFetchJson(url, api.reviews.summary.responses[200]);
}

export async function fetchReviews(
  productId: number,
  input: Partial<ReviewListQuery> = {},
): Promise<ReviewListResponse> {
  const url = buildUrl(api.reviews.list.path, { productId });
  const query = api.reviews.list.query.parse(input);
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  return apiFetchJson(`${url}?${params}`, api.reviews.list.responses[200]);
}

export async function fetchMyReview(productId: number): Promise<ReviewBaseResponse | null> {
  const url = buildUrl(api.reviews.mine.path, { productId });
  return apiFetchJson(url, api.reviews.mine.responses[200]);
}

export async function submitReview(
  productId: number,
  rating: number,
  body?: string,
): Promise<Review> {
  const url = buildUrl(api.reviews.upsert.path, { productId });
  const input = api.reviews.upsert.input.parse({ rating, body });
  return apiRequestJson(
    api.reviews.upsert.method,
    url,
    input,
    api.reviews.upsert.responses[201],
  );
}

export type LatestReview = LatestReviewResponse;

export async function fetchLatestReviews(limit = 3): Promise<LatestReview[]> {
  const { limit: parsedLimit } = api.reviews.latest.query.parse({ limit });
  const query = new URLSearchParams({ limit: String(parsedLimit) });
  return apiFetchJson(
    `${api.reviews.latest.path}?${query}`,
    api.reviews.latest.responses[200],
  );
}
