import assert from "node:assert/strict";
import test from "node:test";
import { db } from "./client";
import { CartService } from "../modules/cart/cart.service";
import { createIntegrationFixture } from "../test-utils/integration-db";

test("concurrent cart adds accumulate in one unique user-product row", async (t) => {
  const fixture = await createIntegrationFixture();
  t.after(() => fixture.cleanup());

  await Promise.all(
    Array.from({ length: 12 }, () => CartService.add(fixture.user.id, fixture.product.id, 1)),
  );

  const items = await db.cartItem.findMany({
    where: { userId: fixture.user.id, productId: fixture.product.id },
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 12);
});
