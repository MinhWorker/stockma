import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getOverviewReport } from '@/services/report.service';
import { StatCard } from '../_components/stat-card';
import { ReportFilters } from '../_components/report-filters';
import { InventoryBadge } from '../_components/inventory-badge';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ inventoryId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function OverviewReportPage({ params, searchParams }: Props) {
  const { inventoryId } = await params;
  const { from, to } = await searchParams;
  const t = await getTranslations('reports.overview');

  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-1 text-xl font-semibold">{t('title')}</h1>
      <InventoryBadge inventoryId={inventoryId} />
      <ReportFilters />
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewData inventoryId={inventoryId === 'all' ? undefined : Number(inventoryId)} dateFrom={from} dateTo={to} />
      </Suspense>
    </div>
  );
}

async function OverviewData({ inventoryId, dateFrom, dateTo }: { inventoryId?: number; dateFrom?: string; dateTo?: string }) {
  const [data, t] = await Promise.all([
    getOverviewReport({ inventoryId, dateFrom, dateTo }),
    getTranslations('reports.overview'),
  ]);

  return (
    <div className="px-4 pb-8 space-y-4 pt-2">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('sectionStock')}</p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label={t('totalProducts')} value={String(data.totalProducts)} />
          <StatCard label={t('outOfStock')} value={String(data.outOfStockCount)} accent={data.outOfStockCount > 0 ? 'red' : 'default'} />
          <StatCard label={t('stockValue')} value={formatPrice(data.totalStockValue)} accent="blue" />
          <StatCard label={t('transactions')} value={String(data.totalTransactions)} sub={t('transactionsSub', { stockIn: data.stockInQty, stockOut: data.stockOutQty })} />
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('sectionRevenue')}</p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label={t('estimatedRevenue')} value={formatPrice(data.estimatedRevenue)} sub={t('estimatedRevenueSub')} />
          <StatCard label={t('actualRevenue')} value={formatPrice(data.actualRevenue)} sub={t('actualRevenueSub')} accent="green" />
          <StatCard label={t('totalCost')} value={formatPrice(data.totalCost)} accent="red" />
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('sectionProfit')}</p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label={t('estimatedProfit')} value={formatPrice(data.estimatedGrossProfit)} accent={data.estimatedGrossProfit >= 0 ? 'green' : 'red'} />
          <StatCard label={t('actualProfit')} value={formatPrice(data.actualGrossProfit)} accent={data.actualGrossProfit >= 0 ? 'green' : 'red'} />
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('sectionDebt')}</p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label={t('openDebt')} value={String(data.openDebtCount)} accent={data.openDebtCount > 0 ? 'red' : 'default'} />
          <StatCard label={t('totalDebt')} value={formatPrice(data.openDebtAmount)} accent={data.openDebtAmount > 0 ? 'red' : 'default'} />
        </div>
      </section>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="px-4 pt-2 pb-8 space-y-4">
      {[4, 3, 2, 2].map((count, si) => (
        <div key={si} className="space-y-2">
          <div className="h-3 w-24 rounded animate-shimmer" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted/50 px-4 py-3 space-y-1.5">
                <div className="h-2.5 w-20 rounded animate-shimmer" />
                <div className="h-5 w-28 rounded animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
