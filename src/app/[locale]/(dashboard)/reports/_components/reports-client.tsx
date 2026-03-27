'use client';

import { useCallback, useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ActionBar } from '@/components/layout/action-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ReportViewer,
  type ReportType,
  type ReportData,
} from '@/app/[locale]/(dashboard)/reports/_components/report-viewer';
import { getAllProducts } from '@/services/product.service';
import { getTransactions } from '@/services/transaction.service';

// Build functions run client-side from server-fetched initialData
function buildInventorySummary(
  products: Awaited<ReturnType<typeof getAllProducts>>,
  transactions: Awaited<ReturnType<typeof getTransactions>>,
  from: Date | null,
  to: Date | null
): ReportData {
  const rows = products.map((p) => {
    const txs = transactions.filter((t) => {
      const d = t.createdAt;
      return t.productId === p.id && (!from || d >= from) && (!to || d <= to);
    });
    const outQty = txs
      .filter((t) => t.type === 'stock_out')
      .reduce((s, t) => s + Math.abs(t.quantity), 0);
    return {
      productId: p.id,
      productName: p.name,
      category: p.categoryName,
      currentStock: p.stockQty,
      stockValue: p.stockQty * p.costPrice,
      turnoverRate: p.stockQty > 0 ? outQty / p.stockQty : 0,
    };
  });
  return { type: 'inventorySummary', rows };
}

function buildStockMovement(
  products: Awaited<ReturnType<typeof getAllProducts>>,
  transactions: Awaited<ReturnType<typeof getTransactions>>,
  from: Date | null,
  to: Date | null
): ReportData {
  const rows = products.map((p) => {
    const txs = transactions.filter((t) => {
      const d = t.createdAt;
      return t.productId === p.id && (!from || d >= from) && (!to || d <= to);
    });
    const stockIn = txs
      .filter((t) => t.type === 'stock_in' || (t.type === 'adjustment' && t.quantity > 0))
      .reduce((s, t) => s + Math.abs(t.quantity), 0);
    const stockOut = txs
      .filter((t) => t.type === 'stock_out' || (t.type === 'adjustment' && t.quantity < 0))
      .reduce((s, t) => s + Math.abs(t.quantity), 0);
    return {
      productId: p.id,
      productName: p.name,
      openingStock: Math.max(0, p.stockQty - stockIn + stockOut),
      stockIn,
      stockOut,
      closingStock: p.stockQty,
    };
  });
  return { type: 'stockMovement', rows };
}

function buildLowStock(products: Awaited<ReturnType<typeof getAllProducts>>): ReportData {
  const rows = products
    .filter((p) => p.status === 'low_stock' || p.status === 'out_of_stock')
    .map((p) => ({
      productId: p.id,
      productName: p.name,
      category: p.categoryName,
      currentStock: p.stockQty,
      reorderLevel: p.reorderLevel,
    }));
  return { type: 'lowStock', rows };
}

function buildValuation(products: Awaited<ReturnType<typeof getAllProducts>>): ReportData {
  const byCategory = new Map<string, { totalValue: number; productCount: number }>();
  for (const p of products) {
    const existing = byCategory.get(p.categoryName) ?? { totalValue: 0, productCount: 0 };
    byCategory.set(p.categoryName, {
      totalValue: existing.totalValue + p.stockQty * p.costPrice,
      productCount: existing.productCount + 1,
    });
  }
  return {
    type: 'valuation',
    rows: Array.from(byCategory.entries()).map(([category, stats]) => ({ category, ...stats })),
  };
}

interface Props {
  initialProducts: Awaited<ReturnType<typeof getAllProducts>>;
  initialTransactions: Awaited<ReturnType<typeof getTransactions>>;
}

export function ReportsClient({ initialProducts, initialTransactions }: Props) {
  const t = useTranslations('reports');

  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!reportType) return;
    setIsGenerating(true);
    setReportData(null);
    try {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;

      let data: ReportData;
      if (reportType === 'inventorySummary')
        data = buildInventorySummary(initialProducts, initialTransactions, from, to);
      else if (reportType === 'stockMovement')
        data = buildStockMovement(initialProducts, initialTransactions, from, to);
      else if (reportType === 'lowStock') data = buildLowStock(initialProducts);
      else data = buildValuation(initialProducts);

      setReportData(data);
    } finally {
      setIsGenerating(false);
    }
  }, [reportType, dateFrom, dateTo, initialProducts, initialTransactions]);

  return (
    <>
      <ActionBar
        action={
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerate} disabled={!reportType || isGenerating}>
              <BarChart3 className="mr-2 size-4" />
              {isGenerating ? t('generating') : t('generate')}
            </Button>
            <Button
              variant="outline"
              disabled={reportData === null}
              onClick={() => toast.info(t('download'))}
            >
              <Download className="mr-2 size-4" />
              {t('download')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t('reportType')}</Label>
            <Select
              value={reportType ?? ''}
              onValueChange={(v) => {
                setReportType(v as ReportType);
                setReportData(null);
              }}
            >
              <SelectTrigger className="w-52" aria-label={t('reportType')}>
                <SelectValue placeholder={t('reportTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventorySummary">{t('types.inventorySummary')}</SelectItem>
                <SelectItem value="stockMovement">{t('types.stockMovement')}</SelectItem>
                <SelectItem value="lowStock">{t('types.lowStock')}</SelectItem>
                <SelectItem value="valuation">{t('types.valuation')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t('dateFrom')}</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label={t('dateFrom')}
              className="w-36"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t('dateTo')}</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label={t('dateTo')}
              className="w-36"
            />
          </div>
        </div>
      </ActionBar>

      <ReportViewer reportType={reportType} isLoading={isGenerating} data={reportData} />
    </>
  );
}
