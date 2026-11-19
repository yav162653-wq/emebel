-- Prevent duplicate products in one user's cart and make cart addition atomic.
CREATE UNIQUE INDEX "cart_items_userId_productId_key"
ON "cart_items"("userId", "productId");

-- Support the current list and cleanup query patterns.
CREATE INDEX "cart_items_userId_id_idx"
ON "cart_items"("userId", "id");

CREATE INDEX "orders_userId_createdAt_idx"
ON "orders"("userId", "createdAt");

CREATE INDEX "orders_createdAt_idx"
ON "orders"("createdAt");

CREATE INDEX "order_items_orderId_idx"
ON "order_items"("orderId");

CREATE INDEX "identities_userId_provider_idx"
ON "identities"("userId", "provider");

CREATE INDEX "identities_userId_createdAt_idx"
ON "identities"("userId", "createdAt");

CREATE INDEX "wishlists_userId_createdAt_idx"
ON "wishlists"("userId", "createdAt");

CREATE INDEX "reviews_productId_createdAt_idx"
ON "reviews"("productId", "createdAt");

CREATE INDEX "external_auth_transactions_expiresAt_idx"
ON "external_auth_transactions"("expiresAt");

-- Preserve order history when a user account is deleted.
ALTER TABLE "orders"
DROP CONSTRAINT "orders_userId_fkey";

ALTER TABLE "orders"
ADD CONSTRAINT "orders_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
