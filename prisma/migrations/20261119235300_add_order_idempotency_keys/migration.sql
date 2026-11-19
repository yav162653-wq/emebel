ALTER TABLE "orders"
ADD COLUMN "idempotencyKey" VARCHAR(128),
ADD COLUMN "idempotencyHash" CHAR(64);

CREATE UNIQUE INDEX "orders_userId_idempotencyKey_key"
ON "orders"("userId", "idempotencyKey");
