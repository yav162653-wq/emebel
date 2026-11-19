import assert from "node:assert/strict";
import test from "node:test";
import { startHttpTestServer } from "../../test-utils/http";
import { ReviewsService } from "./reviews.service";
import { createReviewsRouter, type ReviewsRouterService } from "./reviews.router";

const review = {
  id: 8,
  productId: 7,
  userId: 4,
  rating: 5,
  body: "Excellent",
  createdAt: new Date("2026-01-02T00:00:00.000Z"),
  user: { id: 4, name: "Member", username: "member" },
};

function createService() {
  const calls: Array<{ productId: number; page: number; pageSize: number }> = [];
  const service: ReviewsRouterService = {
    ...ReviewsService,
    async getByProduct(productId, query) {
      calls.push({ productId, page: query.page, pageSize: query.pageSize });
      return {
        items: [review],
        total: 14,
        page: query.page,
        pageSize: query.pageSize,
      };
    },
  };
  return { service, calls };
}

test("review route returns a bounded page and passes parsed pagination to the service", async (t) => {
  const { service, calls } = createService();
  const baseUrl = await startHttpTestServer(t, createReviewsRouter(service), {
    mountPath: "/api/reviews",
  });

  const response = await fetch(
    `${baseUrl}/api/reviews/7?page=2&pageSize=5`,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    items: [{
      ...review,
      createdAt: review.createdAt.toISOString(),
    }],
    total: 14,
    page: 2,
    pageSize: 5,
  });
  assert.deepEqual(calls, [{ productId: 7, page: 2, pageSize: 5 }]);
});

test("review route rejects an invalid page size before querying", async (t) => {
  const { service, calls } = createService();
  const baseUrl = await startHttpTestServer(t, createReviewsRouter(service), {
    mountPath: "/api/reviews",
  });

  const response = await fetch(`${baseUrl}/api/reviews/7?pageSize=51`);
  assert.equal(response.status, 400);
  assert.deepEqual(calls, []);
});
