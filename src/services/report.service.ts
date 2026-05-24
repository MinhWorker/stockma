import 'server-only';
import { prisma } from '@/lib/db';
import { parseDateStart, parseDateEnd } from '@/lib/utils';
import { calculateSalesFinancialMetrics } from './financial-metrics';
import { getCurrentAccountingPeriodOrNull } from './accounting-period.service';
import { fetchProductStockMap } from './stock.helpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportFilters {
  inventoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  accountingPeriodId?: number;
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
  const activePeriod = filters.accountingPeriodId ? null : await getCurrentAccountingPeriodOrNull();
  const periodId = filters.accountingPeriodId ?? activePeriod?.id;
  const periodFilter = periodId ? { accountingPeriodId: periodId } : {};

  const [products, saleTransactions, stockInTransactions, openDebtGroups, debtPayments, transactionCounts] =
    await Promise.all([
      prisma.product.findMany({
        where: inventoryId ? { inventoryId } : undefined,
        select: { id: true, costPrice: true },
      }),
      prisma.stockTransaction.findMany({
        where: {
          type: 'stock_out',
          stockOutType: { in: ['retail', 'wholesale'] },
          isGift: false,
          ...inventoryFilter,
          ...transactionDateFilter,
          ...periodFilter,
        },
        select: {
          quantity: true,
          salePrice: true,
          purchasePrice: true,
          product: { select: { costPrice: true } },
          variant: { select: { costPrice: true } },
          debtGroup: { select: { paidAmount: true, initialPaidAmount: true } },
        },
      }),
      prisma.stockTransaction.findMany({
        where: { type: 'stock_in', ...inventoryFilter, ...transactionDateFilter, ...periodFilter },
        select: { quantity: true, purchasePrice: true },
      }),
      prisma.debtGroup.findMany({
        where: { status: 'open', ...(inventoryId && { transaction: { product: { inventoryId } } }) },
        select: { totalAmount: true, paidAmount: true },
      }),
      prisma.debtPayment.findMany({
        where: {
          ...periodFilter,
          ...transactionDateFilter,
          ...(inventoryId ? { debtGroup: { transaction: { product: { inventoryId } } } } : {}),
        },
        select: { amount: true },
      }),
      prisma.stockTransaction.groupBy({
        by: ['type'],
        where: { ...inventoryFilter, ...transactionDateFilter, ...periodFilter },
        _sum: { quantity: true },
        _count: { id: true },
      }),
    ]);

  const stockMap = await fetchProductStockMap({ inventoryId, accountingPeriodId: periodId });
  const { totalStockValue, outOfStockCount } = calculateStockMetrics(products, stockMap);
  const debtPaymentAmount = debtPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const {
    estimatedRevenue,
    actualRevenue,
    estimatedGrossProfit,
    actualGrossProfit,
  } = calculateSalesFinancialMetrics(saleTransactions, debtPaymentAmount);
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
    estimatedGrossProfit,
    actualGrossProfit,
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
  const activePeriod = filters.accountingPeriodId ? null : await getCurrentAccountingPeriodOrNull();
  const periodId = filters.accountingPeriodId ?? activePeriod?.id;
  const periodFilter = periodId ? { accountingPeriodId: periodId } : {};

  const products = await prisma.product.findMany({
    where: inventoryId ? { inventoryId } : undefined,
    select: { id: true, name: true, costPrice: true, category: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });

  const productIds = products.map((p) => p.id);

  const [stockMap, allTransactions, debtPayments] = await Promise.all([
    fetchProductStockMap({ productIds, accountingPeriodId: periodId }),
    prisma.stockTransaction.findMany({
      where: { productId: { in: productIds }, ...transactionDateFilter, ...periodFilter },
      select: {
        productId: true,
        type: true,
        quantity: true,
        salePrice: true,
        purchasePrice: true,
        isGift: true,
        stockOutType: true,
        debtGroup: { select: { paidAmount: true, initialPaidAmount: true } },
      },
    }),
    prisma.debtPayment.findMany({
      where: {
        ...periodFilter,
        ...transactionDateFilter,
        debtGroup: { transaction: { productId: { in: productIds } } },
      },
      select: { amount: true, debtGroup: { select: { transaction: { select: { productId: true } } } } },
    }),
  ]);

  const debtPaymentsByProduct = new Map<number, number>();
  for (const payment of debtPayments) {
    const productId = payment.debtGroup.transaction.productId;
    debtPaymentsByProduct.set(productId, (debtPaymentsByProduct.get(productId) ?? 0) + payment.amount);
  }

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
        actualRevenue += tx.debtGroup ? (tx.debtGroup.initialPaidAmount ?? tx.debtGroup.paidAmount) : amount;
      }
    }
    actualRevenue += debtPaymentsByProduct.get(p.id) ?? 0;

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
  const activePeriod = filters.accountingPeriodId ? null : await getCurrentAccountingPeriodOrNull();
  const periodId = filters.accountingPeriodId ?? activePeriod?.id;
  const periodFilter = periodId ? { accountingPeriodId: periodId } : {};

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

    const [stockMap, stockInTransactions] = await Promise.all([
      fetchProductStockMap({ productIds, accountingPeriodId: periodId }),
      prisma.stockTransaction.findMany({
        where: {
          type: 'stock_in',
          productId: { in: productIds },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
          ...periodFilter,
        },
        select: { quantity: true, purchasePrice: true },
      }),
    ]);

    const totalStockValue = provider.provideItems.reduce(
      (sum, p) => sum + (stockMap.get(p.id) ?? 0) * p.costPrice,
      0
    );

    rows.push({
      providerId: provider.id,
      providerName: provider.name,
      totalProducts: provider.provideItems.length,
      totalStockValue,
      totalCost: calculateTotalCost(stockInTransactions),
      stockInQty: stockInTransactions.reduce((sum, tx) => sum + tx.quantity, 0),
    });
  }

  return rows;
}

export async function getStockMovementReport(filters: ReportFilters): Promise<StockMovementRow[]> {
  const { inventoryId, dateFrom, dateTo } = filters;
  const dateFilter = buildDateRangeFilter(dateFrom, dateTo);
  const transactionDateFilter = dateFilter ? { createdAt: dateFilter } : {};
  const activePeriod = filters.accountingPeriodId ? null : await getCurrentAccountingPeriodOrNull();
  const periodId = filters.accountingPeriodId ?? activePeriod?.id;
  const periodFilter = periodId ? { accountingPeriodId: periodId } : {};

  const products = await prisma.product.findMany({
    where: inventoryId ? { inventoryId } : undefined,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const productIds = products.map((p) => p.id);
  const transactions = await prisma.stockTransaction.findMany({
    where: { productId: { in: productIds }, ...transactionDateFilter, ...periodFilter },
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
  const activePeriod = filters.accountingPeriodId ? null : await getCurrentAccountingPeriodOrNull();
  const periodId = filters.accountingPeriodId ?? activePeriod?.id;

  const rows = await prisma.debtGroup.findMany({
    where: {
      ...(inventoryId && { transaction: { product: { inventoryId } } }),
      ...(dateFilter && { createdAt: dateFilter }),
      ...(periodId && {
        OR: [
          { transaction: { accountingPeriodId: periodId } },
          { periodDebtBalances: { some: { accountingPeriodId: periodId } } },
        ],
      }),
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
