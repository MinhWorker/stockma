import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/db';
import { getTransactions } from './transaction.service';
import type { DashboardStats } from './types';

/**
 * Tinh toan toan bo chi so tong hop cho trang Dashboard.
 *
 * Cac chi so tai chinh:
 * - totalStockValue: SUM(stockQty * costPrice) - gia tri hang ton kho hien tai
 * - totalRevenue:    SUM(|quantity| * price)    - doanh thu tu cac lan xuat kho (ban hang)
 * - totalCost:       SUM(|quantity| * costPrice) - chi phi nhap hang
 * - grossProfit:     totalRevenue - totalCost   - loi nhuan gop
 *
 * Luu y: price la gia ban, costPrice la gia nhap. Adjustment khong tinh vao doanh thu/chi phi.
 */
export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  // Lay tat ca du lieu can thiet song song de giam latency
  const [
    totalProducts,
    totalInventories,
    totalProviders,
    stockAggregates,
    products,
    recentTransactions,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.inventory.count(),
    prisma.provider.count(),
    // Ton kho theo tung san pham
    prisma.stockTransaction.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
    }),
    // Lay costPrice, price, reorderLevel de tinh gia tri kho va trang thai
    prisma.product.findMany({
      select: { id: true, costPrice: true, price: true, reorderLevel: true },
    }),
    // 10 giao dich gan nhat cho widget "Recent Activity"
    getTransactions({ limit: 10 }),
  ]);

  // Xay dung map: productId -> stockQty
  const stockMap = new Map<number, number>(
    stockAggregates.map((row) => [row.productId, row._sum.quantity ?? 0])
  );

  // Xay dung map: productId -> { costPrice, price, reorderLevel }
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Tinh tong gia tri ton kho va dem san pham theo trang thai
  let totalStockValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const product of products) {
    const qty = stockMap.get(product.id) ?? 0;
    totalStockValue += qty * product.costPrice;

    if (qty === 0) {
      outOfStockCount++;
    } else if (qty <= product.reorderLevel) {
      lowStockCount++;
    }
  }

  // Tinh doanh thu va chi phi tu lich su giao dich
  // Lay tat ca giao dich stock_in va stock_out de tinh toan
  const financialTransactions = await prisma.stockTransaction.findMany({
    where: { type: { in: ['stock_in', 'stock_out'] } },
    select: { type: true, quantity: true, productId: true },
  });

  let totalRevenue = 0;
  let totalCost = 0;

  for (const tx of financialTransactions) {
    const product = productMap.get(tx.productId);
    if (!product) continue;

    const absQty = Math.abs(tx.quantity);

    if (tx.type === 'stock_out') {
      // Doanh thu = so luong xuat * gia ban
      totalRevenue += absQty * product.price;
    } else if (tx.type === 'stock_in') {
      // Chi phi nhap hang = so luong nhap * gia nhap
      totalCost += absQty * product.costPrice;
    }
  }

  return {
    totalProducts,
    totalInventories,
    totalProviders,
    lowStockCount,
    outOfStockCount,
    totalStockValue,
    totalRevenue,
    totalCost,
    grossProfit: totalRevenue - totalCost,
    recentTransactions,
  };
});
