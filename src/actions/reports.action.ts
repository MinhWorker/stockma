'use server';

import { getAllProducts } from '@/services/product.service';
import { getTransactions } from '@/services/transaction.service';

export type ReportType = 'inventorySummary' | 'stockMovement' | 'lowStock' | 'valuation';

export interface ReportRow {
  label: string;
  value: string | number;
}

export interface GenerateReportInput {
  type: ReportType;
  dateFrom?: string;
  dateTo?: string;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
}

export async function generateReportAction(
  input: GenerateReportInput
): Promise<ActionResult<ReportRow[]>> {
  try {
    // async-parallel: fetch both at once
    const [products, transactions] = await Promise.all([getAllProducts(), getTransactions()]);

    const from = input.dateFrom ? new Date(input.dateFrom).getTime() : null;
    const to = input.dateTo ? new Date(input.dateTo + 'T23:59:59').getTime() : null;
    const inRange = (d: Date | string) => {
      const t = new Date(d).getTime();
      return (!from || t >= from) && (!to || t <= to);
    };

    let rows: ReportRow[] = [];

    if (input.type === 'inventorySummary') {
      const totalStock = products.reduce((s, p) => s + p.stockQty, 0);
      const totalValue = products.reduce((s, p) => s + p.stockQty * p.costPrice, 0);
      const lowCount = products.filter((p) => p.status === 'out_of_stock').length;
      rows = [
        { label: 'Tổng sản phẩm', value: products.length },
        { label: 'Tổng tồn kho', value: totalStock },
        { label: 'Giá trị tồn kho', value: formatVND(totalValue) },
        { label: 'Sản phẩm sắp hết', value: lowCount },
      ];
    } else if (input.type === 'stockMovement') {
      const filtered = transactions.filter((tx) => inRange(tx.createdAt));
      const stockIn = filtered
        .filter((tx) => tx.type === 'stock_in')
        .reduce((s, tx) => s + tx.quantity, 0);
      const stockOut = filtered
        .filter((tx) => tx.type === 'stock_out')
        .reduce((s, tx) => s + Math.abs(tx.quantity), 0);
      rows = [
        { label: 'Tổng nhập kho', value: stockIn },
        { label: 'Tổng xuất kho', value: stockOut },
        { label: 'Số điều chỉnh', value: filtered.filter((tx) => tx.type === 'adjustment').length },
        { label: 'Tổng giao dịch', value: filtered.length },
      ];
    } else if (input.type === 'lowStock') {
      const low = products.filter((p) => p.status === 'out_of_stock');
      rows =
        low.length > 0
          ? low.map((p) => ({ label: p.name, value: `Tồn: ${p.stockQty}` }))
          : [{ label: 'Không có sản phẩm sắp hết hàng', value: '' }];
    } else {
      // valuation by category
      const byCategory = new Map<string, number>();
      for (const p of products) {
        byCategory.set(
          p.categoryName,
          (byCategory.get(p.categoryName) ?? 0) + p.stockQty * p.costPrice
        );
      }
      rows = Array.from(byCategory.entries()).map(([label, value]) => ({
        label,
        value: formatVND(value),
      }));
    }

    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

