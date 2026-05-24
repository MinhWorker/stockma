-- CreateEnum
CREATE TYPE "AccountingPeriodStatus" AS ENUM ('open', 'closed');

-- DropIndex
DROP INDEX "StockTransaction_targetTransactionId_idx";

-- AlterTable
ALTER TABLE "DebtGroup" ADD COLUMN     "initialPaidAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DebtPayment" ADD COLUMN     "accountingPeriodId" INTEGER;

-- AlterTable
ALTER TABLE "ReturnTransaction" ADD COLUMN     "accountingPeriodId" INTEGER;

-- AlterTable
ALTER TABLE "StockTransaction" ADD COLUMN     "accountingPeriodId" INTEGER;

-- CreateTable
CREATE TABLE "AccountingPeriod" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "status" "AccountingPeriodStatus" NOT NULL DEFAULT 'open',
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodInventoryBalance" (
    "id" SERIAL NOT NULL,
    "accountingPeriodId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "variantId" INTEGER,
    "stockKey" TEXT NOT NULL,
    "openingQty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodInventoryBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodDebtBalance" (
    "id" SERIAL NOT NULL,
    "accountingPeriodId" INTEGER NOT NULL,
    "debtGroupId" INTEGER NOT NULL,
    "openingRemainingAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodDebtBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingPeriod_status_idx" ON "AccountingPeriod"("status");

-- CreateIndex
CREATE INDEX "AccountingPeriod_startAt_endAt_idx" ON "AccountingPeriod"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "PeriodInventoryBalance_productId_idx" ON "PeriodInventoryBalance"("productId");

-- CreateIndex
CREATE INDEX "PeriodInventoryBalance_variantId_idx" ON "PeriodInventoryBalance"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodInventoryBalance_accountingPeriodId_stockKey_key" ON "PeriodInventoryBalance"("accountingPeriodId", "stockKey");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodDebtBalance_accountingPeriodId_debtGroupId_key" ON "PeriodDebtBalance"("accountingPeriodId", "debtGroupId");

-- CreateIndex
CREATE INDEX "DebtPayment_accountingPeriodId_idx" ON "DebtPayment"("accountingPeriodId");

-- CreateIndex
CREATE INDEX "ReturnTransaction_accountingPeriodId_idx" ON "ReturnTransaction"("accountingPeriodId");

-- CreateIndex
CREATE INDEX "StockTransaction_accountingPeriodId_idx" ON "StockTransaction"("accountingPeriodId");

-- AddForeignKey
ALTER TABLE "AccountingPeriod" ADD CONSTRAINT "AccountingPeriod_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingPeriod" ADD CONSTRAINT "AccountingPeriod_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodInventoryBalance" ADD CONSTRAINT "PeriodInventoryBalance_accountingPeriodId_fkey" FOREIGN KEY ("accountingPeriodId") REFERENCES "AccountingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodInventoryBalance" ADD CONSTRAINT "PeriodInventoryBalance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodInventoryBalance" ADD CONSTRAINT "PeriodInventoryBalance_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodDebtBalance" ADD CONSTRAINT "PeriodDebtBalance_accountingPeriodId_fkey" FOREIGN KEY ("accountingPeriodId") REFERENCES "AccountingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodDebtBalance" ADD CONSTRAINT "PeriodDebtBalance_debtGroupId_fkey" FOREIGN KEY ("debtGroupId") REFERENCES "DebtGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_accountingPeriodId_fkey" FOREIGN KEY ("accountingPeriodId") REFERENCES "AccountingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnTransaction" ADD CONSTRAINT "ReturnTransaction_accountingPeriodId_fkey" FOREIGN KEY ("accountingPeriodId") REFERENCES "AccountingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtPayment" ADD CONSTRAINT "DebtPayment_accountingPeriodId_fkey" FOREIGN KEY ("accountingPeriodId") REFERENCES "AccountingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
