import 'server-only';
import { prisma } from '@/lib/db';
import { getCurrentAccountingPeriodOrNull } from './accounting-period.service';

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export function buildStockKey(productId: number, variantId?: number | null): string {
  return `${productId}:${variantId ?? 'base'}`;
}

/**
 * Returns the latest stockAfter for a product (or variant) within a transaction.
 * Used to compute stockBefore for the next transaction.
 */
export async function getLatestStockSnapshot(
  tx: PrismaTx,
  productId: number,
  variantId?: number | null,
  accountingPeriodId?: number | null
): Promise<number> {
  const where = variantId ? { variantId } : { productId, variantId: null };
  const latest = await tx.stockTransaction.findFirst({
    where: {
      ...where,
      ...(accountingPeriodId ? { accountingPeriodId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: { stockAfter: true },
  });

  if (latest) return latest.stockAfter;

  if (!accountingPeriodId) return 0;

  const openingBalance = await tx.periodInventoryBalance.findUnique({
    where: {
      accountingPeriodId_stockKey: {
        accountingPeriodId,
        stockKey: buildStockKey(productId, variantId),
      },
    },
    select: { openingQty: true },
  });

  return openingBalance?.openingQty ?? 0;
}

async function resolveAccountingPeriodId(accountingPeriodId?: number): Promise<number | undefined> {
  if (accountingPeriodId) return accountingPeriodId;
  const currentPeriod = await getCurrentAccountingPeriodOrNull();
  return currentPeriod?.id;
}

/**
 * Aggregates total stock quantity for a single product across all transactions.
 */
export async function fetchProductStockQuantity(productId: number, accountingPeriodId?: number): Promise<number> {
  const periodId = await resolveAccountingPeriodId(accountingPeriodId);

  if (!periodId) {
    const result = await prisma.stockTransaction.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  const [openingBalances, result] = await Promise.all([
    prisma.periodInventoryBalance.aggregate({
      where: { accountingPeriodId: periodId, productId },
      _sum: { openingQty: true },
    }),
    prisma.stockTransaction.aggregate({
      where: { productId, accountingPeriodId: periodId },
      _sum: { quantity: true },
    }),
  ]);

  return (openingBalances._sum.openingQty ?? 0) + (result._sum.quantity ?? 0);
}

/**
 * Aggregates total stock quantity for a single variant across all transactions.
 */
export async function fetchVariantStockQuantity(variantId: number, accountingPeriodId?: number): Promise<number> {
  const periodId = await resolveAccountingPeriodId(accountingPeriodId);

  if (!periodId) {
    const result = await prisma.stockTransaction.aggregate({
      where: { variantId },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  const [openingBalance, result] = await Promise.all([
    prisma.periodInventoryBalance.findFirst({
      where: { accountingPeriodId: periodId, variantId },
      select: { openingQty: true },
    }),
    prisma.stockTransaction.aggregate({
      where: { variantId, accountingPeriodId: periodId },
      _sum: { quantity: true },
    }),
  ]);

  return (openingBalance?.openingQty ?? 0) + (result._sum.quantity ?? 0);
}

export async function fetchProductStockMap(options?: {
  productIds?: number[];
  inventoryId?: number;
  accountingPeriodId?: number | null;
}): Promise<Map<number, number>> {
  const periodId = options?.accountingPeriodId ?? (await resolveAccountingPeriodId(undefined));
  const productWhere = {
    ...(options?.productIds ? { productId: { in: options.productIds } } : {}),
    ...(options?.inventoryId ? { product: { inventoryId: options.inventoryId } } : {}),
  };

  const [openingBalances, stockAggregates] = await Promise.all([
    periodId
      ? prisma.periodInventoryBalance.groupBy({
          by: ['productId'],
          where: { accountingPeriodId: periodId, ...productWhere },
          _sum: { openingQty: true },
        })
      : Promise.resolve([]),
    prisma.stockTransaction.groupBy({
      by: ['productId'],
      where: {
        ...productWhere,
        ...(periodId ? { accountingPeriodId: periodId } : {}),
      },
      _sum: { quantity: true },
    }),
  ]);

  const stockMap = new Map<number, number>();
  for (const balance of openingBalances) {
    stockMap.set(balance.productId, (stockMap.get(balance.productId) ?? 0) + (balance._sum.openingQty ?? 0));
  }
  for (const aggregate of stockAggregates) {
    stockMap.set(aggregate.productId, (stockMap.get(aggregate.productId) ?? 0) + (aggregate._sum.quantity ?? 0));
  }

  return stockMap;
}
