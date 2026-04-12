import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getProviderReport } from '@/services/report.service';
import { ReportFilters } from '../_components/report-filters';
import { InventoryBadge } from '../_components/inventory-badge';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ inventoryId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ProvidersReportPage({ params, searchParams }: Props) {
  const [{ inventoryId }, { from, to }] = await Promise.all([params, searchParams]);
  const t = await getTranslations('reports.providers');
  return (
    <div className="space-y-0">
      <InventoryBadge inventoryId={inventoryId} />
      <ReportFilters />
      <Suspense fallback={<TableSkeleton />}>
        <ProvidersData inventoryId={inventoryId === 'all' ? undefined : Number(inventoryId)} dateFrom={from} dateTo={to} />
      </Suspense>
    </div>
  );
}

async function ProvidersData({ inventoryId, dateFrom, dateTo }: { inventoryId?: number; dateFrom?: string; dateTo?: string }) {
  const [rows, t] = await Promise.all([
    getProviderReport({ inventoryId, dateFrom, dateTo }),
    getTranslations('reports.providers'),
  ]);

  if (rows.length === 0) {
    return <p className="px-4 py-12 text-center text-sm text-muted-foreground">{t('emptyDesc')}</p>;
  }

  return (
    <div className="px-4 pb-8 pt-2 space-y-2">
      <p className="text-xs text-muted-foreground">{t('countLabel', { count: rows.length })}</p>
      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60 bg-card">
        {rows.map((row) => (
          <div key={row.providerId} className="px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium truncate">{row.providerName}</p>
              <p className="text-xs text-muted-foreground shrink-0">{t('productsCount', { count: row.totalProducts })}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 text-xs">
              <span className="text-muted-foreground">{t('stockValue')}: <span className="text-foreground font-medium">{formatPrice(row.totalStockValue)}</span></span>
              <span className="text-muted-foreground">{t('stockIn')}: <span className="text-foreground font-medium">{row.stockInQty}</span></span>
              <span className="text-muted-foreground col-span-2">{t('totalCost')}: <span className="text-rose-600 dark:text-rose-400 font-medium">{formatPrice(row.totalCost)}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="px-4 pt-2 pb-8 space-y-2">
      <div className="h-3 w-28 rounded animate-shimmer" />
      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-2/5 rounded animate-shimmer" />
              <div className="h-3 w-1/6 rounded animate-shimmer" />
            </div>
            <div className="h-2.5 w-3/5 rounded animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
