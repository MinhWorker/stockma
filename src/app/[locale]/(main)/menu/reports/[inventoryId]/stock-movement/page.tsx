import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getStockMovementReport } from '@/services/report.service';
import { getAccountingPeriods } from '@/services/accounting-period.service';
import { ReportFilters } from '../_components/report-filters';
import { InventoryBadge } from '../_components/inventory-badge';
import { formatPrice } from '@/lib/utils';
import { ProductAvatar } from '@/components/data-display/product-avatar';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ inventoryId: string }>;
  searchParams: Promise<{ from?: string; to?: string; period?: string }>;
}

export default async function StockMovementPage({ params, searchParams }: Props) {
  const [{ inventoryId }, { from, to, period }, periods] = await Promise.all([params, searchParams, getAccountingPeriods()]);
  const accountingPeriodId = period ? Number(period) : undefined;

  return (
    <div className="space-y-0">
      <InventoryBadge inventoryId={inventoryId} />
      <ReportFilters periods={periods} />
      <Suspense fallback={<TableSkeleton />}>
        <StockMovementData
          inventoryId={inventoryId === 'all' ? undefined : Number(inventoryId)}
          dateFrom={from}
          dateTo={to}
          accountingPeriodId={Number.isFinite(accountingPeriodId) ? accountingPeriodId : undefined}
        />
      </Suspense>
    </div>
  );
}

async function StockMovementData({ inventoryId, dateFrom, dateTo, accountingPeriodId }: { inventoryId?: number; dateFrom?: string; dateTo?: string; accountingPeriodId?: number }) {
  const [rows, t] = await Promise.all([
    getStockMovementReport({ inventoryId, dateFrom, dateTo, accountingPeriodId }),
    getTranslations('reports.stockMovement'),
  ]);
  const tReports = await getTranslations('reports');

  if (rows.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-muted-foreground">
        {dateFrom || dateTo ? tReports('noDataInRange') : tReports('noData')}
      </p>
    );
  }

  return (
    <div className="px-4 pb-8 pt-2 space-y-2">
      <p className="text-xs text-muted-foreground">
        {t('countLabel', { count: rows.length })}
        {(dateFrom || dateTo) && (
          <span className="ml-2 text-muted-foreground/60">
            {dateFrom ?? '…'} → {dateTo ?? '…'}
          </span>
        )}
      </p>
      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60 bg-card">
        {rows.map((row) => (
          <div key={row.productId} className="px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-3">
              <ProductAvatar name={row.productName} imageUrl={row.imageUrl} size="sm" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{row.productName}</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400">+{row.stockInQty} {t('stockIn')}</span>
              <span className="text-rose-600 dark:text-rose-400">-{row.stockOutQty} {t('stockOut')}</span>
              {row.adjustmentQty !== 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                  {row.adjustmentQty > 0 ? '+' : ''}{row.adjustmentQty} {t('adjustment')}
                </span>
              )}
              <span className="text-muted-foreground ml-auto">
                {t('netChange')}: {row.netChange > 0 ? '+' : ''}{row.netChange}
              </span>
            </div>
            {row.estimatedRevenue > 0 && (
              <p className="text-xs text-muted-foreground">{t('estimatedRevenue')}: {formatPrice(row.estimatedRevenue)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="px-4 pt-2 pb-8 space-y-2">
      <div className="h-3 w-32 rounded animate-shimmer" />
      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-2">
            <div className="h-3 w-2/3 rounded animate-shimmer" />
            <div className="h-2.5 w-1/2 rounded animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
