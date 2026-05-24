-- Restore the correction lookup index preserved in the Prisma schema.
CREATE INDEX IF NOT EXISTS "StockTransaction_targetTransactionId_idx" ON "StockTransaction"("targetTransactionId");
