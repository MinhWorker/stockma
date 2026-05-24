-- CreateEnum
CREATE TYPE "TransactionCorrectionType" AS ENUM ('quantity_edit', 'cancellation');

-- AlterTable
ALTER TABLE "StockTransaction"
ADD COLUMN "targetTransactionId" INTEGER,
ADD COLUMN "correctionType" "TransactionCorrectionType",
ADD COLUMN "correctedQuantity" INTEGER;

-- CreateIndex
CREATE INDEX "StockTransaction_targetTransactionId_idx" ON "StockTransaction"("targetTransactionId");

-- AddForeignKey
ALTER TABLE "StockTransaction"
ADD CONSTRAINT "StockTransaction_targetTransactionId_fkey"
FOREIGN KEY ("targetTransactionId") REFERENCES "StockTransaction"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
