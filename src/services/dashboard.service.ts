import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { getTransactions } from './transaction.service';
import type { DashboardStats } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildLast7DaysWindow(): { sevenDaysAgo: Date; dateKeys: string[] } {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dateKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateKeys.push(d.toISOString().slice(0, 10));
  }

  return { sevenDaysAgo, dateKeys };
}

function calculateStockValueAndOutOfStock(
  products: Array<{ id: number; costPrice: number }>,
  stockMap: Map<number, number>
): { totalStockValue: number; outOfStockCount: number } {
  let totalStockValue = 0;
  let outOfStockCount = 0;
  for (const p of products) {
    const qty = stockMap.get(p.id) ?? 0;
    totalStockValue += qty * p.costPrice;
    if (qty === 0) outOfStockCount++;
  }
  return { totalStockValue, outOfStockCount };
}

function calculateRevenue(
  saleTransactions: Array<{ quantity: number; salePrice: number | null; debtGroup: { id: number; paidAmount: number } | null }>,
  allDebtGroups: Array<{ paidAmount: number }>
): { estimatedRevenue: number; actualRevenue: number } {
  let estimatedRevenue = 0;
  let actualRevenue = 0;
  for (const tx of saleTransactions) {
    const amount = (tx.salePrice ?? 0) * Math.abs(tx.quantity);
    estimatedRevenue += amount;
    if (!tx.debtGroup) actualRevenue += amount;
  }
  for (const dg of allDebtGroups) actualRevenue += dg.paidAmount;
  return { estimatedRevenue, actualRevenue };
}

function buildDailyChart(
  dateKeys: string[],
  transactions: Array<{ type: string; quantity: number; salePrice: number | null; isGift: boolean; stockOutType: string | null; createdAt: Date }>
): DashboardStats['dailyChart'] {
  const dailyMap = new Map(dateKeys.map((key) => [key, { stockIn: 0, stockOut: 0, revenue: 0 }]));

  for (const tx of transactions) {
    const key = new Date(tx.createdAt).toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    if (!entry) continue;

    if (tx.type === 'stock_in') {
      entry.stockIn += tx.quantity;
    } else if (tx.type === 'stock_out') {
      entry.stockOut += Math.abs(tx.quantity);
      if (!tx.isGift && tx.stockOutType !== 'transfer') {
        entry.revenue += (tx.salePrice ?? 0) * Math.abs(tx.quantity);
      }
    }
  }

  return Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v }));
}

async function resolveTopProductNames(
  topProductsRaw: Array<{ productId: number; _sum: { quantity: number | null; salePrice: number | null } }>
): Promise<DashboardStats['topProducts']> {
  const productNames = await prisma.product.findMany({
    where: { id: { in: topProductsRaw.map((r) => r.productId) } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(productNames.map((p) => [p.id, p.name]));

  return topProductsRaw
    .map((r) => ({
      productId: r.productId,
      productName: nameMap.get(r.productId) ?? `#${r.productId}`,
      soldQty: Math.abs(r._sum.quantity ?? 0),
      revenue: r._sum.salePrice ?? 0,
    }))
    .sort((a, b) => b.soldQty - a.soldQty);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getDashboardStats = cache(
  async (inventoryId?: number): Promise<DashboardStats> => {
    const inventoryFilter = inventoryId ? { product: { inventoryId } } : undefined;
    const { sevenDaysAgo, dateKeys } = buildLast7DaysWindow();

    const [
      totalProducts,
      totalInventories,
      totalProviders,
      stockAggregates,
      products,
      recentTransactions,
      saleTransactions,
      stockInTransactions,
      openDebtGroups,
      chartTransactions,
      topProductsRaw,
      allDebtGroups,
    ] = await Promise.all([
      prisma.product.count(inventoryId ? { where: { inventoryId } } : undefined),
      prisma.inventory.count(),
      prisma.provider.count(),
      prisma.stockTransaction.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: inventoryFilter ?? {},
      }),
      prisma.product.findMany({
        where: inventoryId ? { inventoryId } : undefined,
        select: { id: true, costPrice: true },
      }),
      getTransactions({ limit: 10 }),
      prisma.stockTransaction.findMany({
        where: {
          type: 'stock_out',
          stockOutType: { in: ['retail', 'wholesale'] },
          isGift: false,
          ...(inventoryFilter ?? {}),
        },
        select: { id: true, quantity: true, salePrice: true, debtGroup: { select: { id: true, paidAmount: true } } },
      }),
      prisma.stockTransaction.findMany({
        where: { type: 'stock_in', ...(inventoryFilter ?? {}) },
        select: { quantity: true, purchasePrice: true },
      }),
      prisma.debtGroup.findMany({
        where: {
          status: 'open',
          ...(inventoryId ? { transaction: { product: { inventoryId } } } : {}),
        },
        select: { totalAmount: true, paidAmount: true },
      }),
      prisma.stockTransaction.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, ...(inventoryFilter ?? {}) },
        select: { type: true, quantity: true, salePrice: true, isGift: true, stockOutType: true, createdAt: true },
      }),
      // quantity is negative for stock_out, so ascending order = most sold
      prisma.stockTransaction.groupBy({
        by: ['productId'],
        where: {
          type: 'stock_out',
          isGift: false,
          stockOutType: { in: ['retail', 'wholesale'] },
          ...(inventoryFilter ?? {}),
        },
        _sum: { quantity: true, salePrice: true },
        orderBy: { _sum: { quantity: 'asc' } },
        take: 5,
      }),
      prisma.debtGroup.findMany({
        where: inventoryId ? { transaction: { product: { inventoryId } } } : undefined,
        select: { paidAmount: true },
      }),
    ]);

    const stockMap = new Map<number, number>(
      stockAggregates.map((r) => [r.productId, r._sum.quantity ?? 0])
    );

    const { totalStockValue, outOfStockCount } = calculateStockValueAndOutOfStock(products, stockMap);
    const { estimatedRevenue, actualRevenue } = calculateRevenue(saleTransactions, allDebtGroups);
    const totalCost = stockInTransactions.reduce((sum, tx) => sum + (tx.purchasePrice ?? 0) * tx.quantity, 0);
    const openDebtAmount = openDebtGroups.reduce((sum, dg) => sum + (dg.totalAmount - dg.paidAmount), 0);
    const dailyChart = buildDailyChart(dateKeys, chartTransactions);
    const topProducts = await resolveTopProductNames(topProductsRaw);

    return {
      totalProducts,
      totalInventories,
      totalProviders,
      lowStockCount: 0,
      outOfStockCount,
      totalStockValue,
      actualRevenue,
      estimatedRevenue,
      totalCost,
      actualGrossProfit: actualRevenue - totalCost,
      estimatedGrossProfit: estimatedRevenue - totalCost,
      openDebtCount: openDebtGroups.length,
      openDebtAmount,
      recentTransactions,
      dailyChart,
      topProducts,
    };
  }
);
