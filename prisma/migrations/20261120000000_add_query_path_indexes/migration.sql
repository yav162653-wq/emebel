DROP INDEX "orders_createdAt_idx";
CREATE INDEX "orders_createdAt_id_idx"
ON "orders"("createdAt", "id");

CREATE INDEX "orders_status_createdAt_id_idx"
ON "orders"("status", "createdAt", "id");

CREATE INDEX "products_category_id_idx"
ON "products"("category", "id");

DROP INDEX "reviews_productId_createdAt_idx";
CREATE INDEX "reviews_productId_createdAt_id_idx"
ON "reviews"("productId", "createdAt", "id");
