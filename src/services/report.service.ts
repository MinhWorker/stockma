import 'server-only';
import { prisma } from '@/lib/db';
import { parseDateStart, parseDateEnd } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportFilters {
  inventoryId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface OverviewReport {
  totalProducts: number;
  outOfStockCount: number;
  totalStockValue: number;
  estimatedRevenue: number;
  actualRevenue: number;
  totalCost: number;
  estimatedGrossProfit: number;
  actualGrossProfit: number;
  openDebtCount: number;
  openDebtAmount: number;
  stockInQty: number;
  stockOutQty: number;
  totalTransactions: number;
}

export interface ProductReportRow {
  productId: number;
  productName: string;
  categoryName: string;
  stockQty: number;
  stockValue: number;
  stockInQty: number;
  stockOutQty: number;
  estimatedRevenue: number;
  actualRevenue: number;
  totalCost: number;
}

export interface ProviderReportRow {
  providerId: number;
  providerName: string;
  totalProducts: number;
  totalStockValue: number;
  totalCost: number;
  stockInQty: number;
}

export interface StockMovementRow {
  productId: number;
  productName: string;
  stockInQty: number;
  stockOutQty: number;
  adjustmentQty: number;
  netChange: number;
  estimatedRevenue: number;
}

export interface DebtReportRow {
  id: number;
  debtorName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDateRangeFilter(dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return undefined;
  return {
    ...(dateFrom && { gte: parseDateStart(dateFrom) }),
    ...(dateTo && { lte: parseDateEnd(dateTo) }),
  };
}

function calculateStockMetrics(
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

function calculateRevenueFromSales(
  saleTransactions: Array<{ quantity: number; salePrice: number | null; debtGroup: { paidAmount: number } | null }>,
  paidDebtGroups: Array<{ paidAmount: number }>
): { estimatedRevenue: number; actualRevenue: number } {
  let estimatedRevenue = 0;
  let actualRevenue = 0;
  for (const tx of saleTransactions) {
    const amount = (tx.salePrice ?? 0) * Math.abs(tx.quantity);
    estimatedRevenue += amount;
    if (!tx.debtGroup) actualRevenue += amount;
  }
  for (const dg of paidDebtGroups) actualRevenue += dg.paidAmount;
  return { estimatedRevenue, actualRevenue };
}

function calculateTotalCost(
  stockInTransactions: Array<{ quantity: number; purchasePrice: number | null }>
): number {
  return stockInTransactions.reduce((sum, tx) => sum + (tx.purchasePrice ?? 0) * tx.quantity, 0);
}

function calculateOpenDebtAmount(
  openDebtGroups: Array<{ totalAmount: number; paidAmount: number }>
): number {
  return openDebtGroups.reduce((sum, dg) => sum + (dg.totalAmount - dg.paidAmount), 0);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getOverviewReport(filters: ReportFilters): Promise<OverviewReport> {
  const { inventoryId, dateFrom, dateTo } = filters;
  const inventoryFilter = inventoryId ? { product: { inventoryId } } : {};
  const dateFilter = buildDateRangeFilter(dateFrom, dateTo);
  const transactionDateFilter = dateFilter ? { createdAt: dateFilter } : {};

  const [products, stockAggregates, saleTransactions, stockInTransactions, openDebtGroups, paidDebtGroups, transactionCounts] =
    await Promise.all([
      prisma.product.findMany({
        where: inventoryId ? { inventoryId } : undefined,
        select: { id: true, costPrice: true },
      }),
      prisma.stockTransaction.groupBy({
        by: ['productId'],
        where: { ...inventoryFilter },
        _sum: { quantity: true },
      }),
      prisma.stockTransaction.findMany({
        where: { type: 'stock_out', stockOutType: { in: ['retail', 'wholesale'] }, isGift: false, ...inventoryFilter, ...transactionDateFilter },
        select: { quantity: true, salePrice: true, debtGroup: { select: { paidAmount: true } } },
      }),
      prisma.stockTransaction.findMany({
        where: { type: 'stock_in', ...inventoryFilter, ...transactionDateFilter },
        select: { quantity: true, purchasePrice: true },
      }),
      prisma.debtGroup.findMany({
        where: { status: 'open', ...(inventoryId && { transaction: { product: { inventoryId } } }) },
        select: { totalAmount: true, paidAmount: true },
      }),
      prisma.debtGroup.findMany({
        where: {
          ...(inventoryId ? { transaction: { product: { inventoryId } } } : {}),
          ...(dateFilter ? { transaction: { createdAt: dateFilter } } : {}),
        },
        select: { paidAmount: true },
      }),
      prisma.stockTransaction.groupBy({
        by: ['type'],
        where: { ...inventoryFilter, ...transactionDateFilter },
        _sum: { quantity: true },
        _count: { id: true },
      }),
    ]);

  const stockMap = new Map(stockAggregates.map((r) => [r.productId, r._sum.quantity ?? 0]));
  const { totalStockValue, outOfStockCount } = calculateStockMetrics(products, stockMap);
  const { estimatedRevenue, actualRevenue } = calculateRevenueFromSales(saleTransactions, paidDebtGroups);
  const totalCost = calculateTotalCost(stockInTransactions);
  const openDebtAmount = calculateOpenDebtAmount(openDebtGroups);

  const stockInRow = transactionCounts.find((r) => r.type === 'stock_in');
  const stockOutRow = transactionCounts.find((r) => r.type === 'stock_out');
  const totalTransactions = transactionCounts.reduce((s, r) => s + r._count.id, 0);

  return {
    totalProducts: products.length,
    outOfStockCount,
    totalStockValue,
    estimatedRevenue,
    actualRevenue,
    totalCost,
    estimatedGrossProfit: estimatedRevenue - totalCost,
    actualGrossProfit: actualRevenue - totalCost,
    openDebtCount: openDebtGroups.length,
    openDebtAmount,
    stockInQty: stockInRow?._sum.quantity ?? 0,
    stockOutQty: Math.abs(stockOutRow?._sum.quantity ?? 0),
    totalTransactions,
  };
}

export async function getProductReport(filters: ReportFilters): Promise<ProductReportRow[]> {
  const { inventoryId, dateFrom, dateTo } = filters;
  const dateFilter = buildDateRangeFilter(dateFrom, dateTo);
  const transactionDateFilter = dateFilter ? { createdAt: dateFilter } : {};

  const products = await prisma.product.findMany({
    where: inventoryId ? { inventoryId } : undefined,
    select: { id: true, name: true, costPrice: true, category: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });

  const productIds = products.map((p) => p.id);

  const [stockAggregates, allTransactions] = await Promise.all([
    prisma.stockTransaction.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _sum: { quantity: true },
    }),
    prisma.stockTransaction.findMany({
      where: { productId: { in: productIds }, ...transactionDateFilter },
      select: { productId: true, type: true, quantity: true, salePrice: true, purchasePrice: true, isGift: true, stockOutType: true, debtGroup: { select: { paidAmount: true } } },
    }),
  ]);

  const stockMap = new Map(stockAggregates.map((r) => [r.productId, r._sum.quantity ?? 0]));

  return products.map((p) => {
    const transactions = allTransactions.filter((t) => t.productId === p.id);
    const stockQty = stockMap.get(p.id) ?? 0;
    let stockInQty = 0, stockOutQty = 0, estimatedRevenue = 0, actualRevenue = 0, totalCost = 0;

    for (const tx of transactions) {
      if (tx.type === 'stock_in') {
        stockInQty += tx.quantity;
        totalCost += (tx.purchasePrice ?? 0) * tx.quantity;
      } else if (tx.type === 'stock_out' && !tx.isGift && tx.stockOutType !== 'transfer') {
        stockOutQty += Math.abs(tx.quantity);
        const amount = (tx.salePrice ?? 0) * Math.abs(tx.quantity);
        estimatedRevenue += amount;
        if (!tx.debtGroup) actualRevenue += amount;
      }
    }

    return {
      productId: p.id,
      productName: p.name,
      categoryName: p.category.name,
      stockQty,
      stockValue: stockQty * p.costPrice,
      stockInQty,
      stockOutQty,
      estimatedRevenue,
      actualRevenue,
      totalCost,
    };
  });
}

export async function getProviderReport(filters: ReportFilters): Promise<ProviderReportRow[]> {
  const { inventoryId, dateFrom, dateTo } = filters;
  const dateFilter = buildDateRangeFilter(dateFrom, dateTo);

  const providers = await prisma.provider.findMany({
    include: {
      provideItems: {
        where: inventoryId ? { inventoryId } : undefined,
        select: { id: true, costPrice: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const rows: ProviderReportRow[] = [];

  for (const provider of providers) {
    if (provider.provideItems.length === 0) continue;
    const productIds = provider.provideItems.map((p) => p.id);

    const [stockAggregates, stockInAggregate] = await Promise.all([
      prisma.stockTransaction.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds } },
        _sum: { quantity: true },
      }),
      prisma.stockTransaction.aggregate({
        where: {
          type: 'stock_in',
          productId: { in: productIds },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { quantity: true, purchasePrice: true },
      }),
    ]);

    const stockMap = new Map(stockAggregates.map((r) => [r.productId, r._sum.quantity ?? 0]));
    const totalStockValue = provider.provideItems.reduce(
      (sum, p) => sum + (stockMap.get(p.id) ?? 0) * p.costPrice,
      0
    );

    rows.push({
      providerId: provider.id,
      providerName: provider.name,
      totalProducts: provider.provideItems.length,
      totalStockValue,
      totalCost: stockInAggregate._sum.purchasePrice ?? 0,
      stockInQty: stockInAggregate._sum.quantity ?? 0,
    });
  }

  return rows;
}

export async function getStockMovementReport(filters: ReportFilters): Promise<StockMovementRow[]> {
  const { inventoryId, dateFrom, dateTo } = filters;
  const dateFilter = buildDateRangeFilter(dateFrom, dateTo);
  const transactionDateFilter = dateFilter ? { createdAt: dateFilter } : {};

  const products = await prisma.product.findMany({
    where: inventoryId ? { inventoryId } : undefined,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const productIds = products.map((p) => p.id);
  const transactions = await prisma.stockTransaction.findMany({
    where: { productId: { in: productIds }, ...transactionDateFilter },
    select: { productId: true, type: true, quantity: true, salePrice: true, isGift: true, stockOutType: true },
  });

  return products
    .map((p) => {
      const productTransactions = transactions.filter((t) => t.productId === p.id);
      let stockInQty = 0, stockOutQty = 0, adjustmentQty = 0, estimatedRevenue = 0;

      for (const tx of productTransactions) {
        if (tx.type === 'stock_in') stockInQty += tx.quantity;
        else if (tx.type === 'stock_out') {
          stockOutQty += Math.abs(tx.quantity);
          if (!tx.isGift && tx.stockOutType !== 'transfer') {
            estimatedRevenue += (tx.salePrice ?? 0) * Math.abs(tx.quantity);
          }
        } else if (tx.type === 'adjustment') adjustmentQty += tx.quantity;
      }

      return {
        productId: p.id,
        productName: p.name,
        stockInQty,
        stockOutQty,
        adjustmentQty,
        netChange: stockInQty - stockOutQty + adjustmentQty,
        estimatedRevenue,
      };
    })
    .filter((r) => r.stockInQty > 0 || r.stockOutQty > 0 || r.adjustmentQty !== 0);
}

export async function getDebtReport(filters: ReportFilters): Promise<DebtReportRow[]> {
  const { inventoryId, dateFrom, dateTo } = filters;
  const dateFilter = buildDateRangeFilter(dateFrom, dateTo);

  const rows = await prisma.debtGroup.findMany({
    where: {
      ...(inventoryId && { transaction: { product: { inventoryId } } }),
      ...(dateFilter && { createdAt: dateFilter }),
    },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    debtorName: r.debtorName,
    totalAmount: r.totalAmount,
    paidAmount: r.paidAmount,
    remainingAmount: r.totalAmount - r.paidAmount,
    status: r.status,
    createdAt: r.createdAt,
  }));
}
