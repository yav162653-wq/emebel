import assert from "node:assert/strict";
import test from "node:test";
import { NotFoundError } from "../../utils/errors";
import { startHttpTestServer } from "../../test-utils/http";
import { ProductsService } from "./products.service";
import { createProductsRouter, type ProductsRouterService } from "./products.router";

const product = {
  id: 7,
  name: "Oak Chair",
  description: "Solid oak chair",
  price: 120,
  category: "Seating",
  image: "chair.jpg",
  stock: 4,
  material: "Oak",
  warranty: "Lifetime",
  origin: "Studio",
  assembly: "White Glove",
  colors: ["Oak"],
} satisfies Awaited<ReturnType<typeof ProductsService.getById>>;

function createService(): { service: ProductsRouterService; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    service: {
      async getAll(limit) {
        calls.push(`list:${limit ?? "none"}`);
        return [product];
      },
      async getById(id) {
        calls.push(`detail:${id}`);
        if (id !== product.id) throw new NotFoundError("Product");
        return product;
      },
    },
  };
}

test("product routes return catalog data and validate pagination and identifiers", async (t) => {
  const { service, calls } = createService();
  const baseUrl = await startHttpTestServer(t, createProductsRouter(service), {
    mountPath: "/api/products",
  });

  const list = await fetch(`${baseUrl}/api/products?limit=1`);
  assert.equal(list.status, 200);
  assert.deepEqual(await list.json(), [product]);
  assert.deepEqual(calls, ["list:1"]);

  const detail = await fetch(`${baseUrl}/api/products/7`);
  assert.equal(detail.status, 200);
  assert.deepEqual(await detail.json(), product);
  assert.deepEqual(calls, ["list:1", "detail:7"]);

  const invalidLimit = await fetch(`${baseUrl}/api/products?limit=101`);
  assert.equal(invalidLimit.status, 400);
  const invalidId = await fetch(`${baseUrl}/api/products/nope`);
  assert.equal(invalidId.status, 400);
});

test("product route forwards missing-product errors as 404", async (t) => {
  const baseUrl = await startHttpTestServer(
    t,
    createProductsRouter(createService().service),
    { mountPath: "/api/products" },
  );

  const response = await fetch(`${baseUrl}/api/products/99`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).code, "NOT_FOUND");
});
