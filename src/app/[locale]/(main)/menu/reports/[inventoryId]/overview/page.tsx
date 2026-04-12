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
    <div className="space-y-0 pb-24">
      <InventoryBadge inventoryId={inventoryId} />
      <ReportFilters />
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewData
          inventoryId={inventoryId === 'all' ? undefined : Number(inventoryId)}
          dateFrom={from}
          dateTo={to}
        />
      </Suspense>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: render a section with balanced 2-col grid, last odd card full-width
// ---------------------------------------------------------------------------
function StatSection({ title, cards }: { title: string; cards: React.ReactNode[] }) {
  const isOdd = cards.length % 2 !== 0;
  const gridCards = isOdd ? cards.slice(0, -1) : cards;
  const lastCard = isOdd ? cards[cards.length - 1] : null;

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {gridCards}
      </div>
      {lastCard && (
        <div className="grid grid-cols-1">
          {lastCard}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Data component
// ---------------------------------------------------------------------------
async function OverviewData({
  inventoryId,
  dateFrom,
  dateTo,
}: {
  inventoryId?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const [data, t] = await Promise.all([
    getOverviewReport({ inventoryId, dateFrom, dateTo }),
    getTranslations('reports.overview'),
  ]);

  return (
    <div className="px-4 pb-4 space-y-5 pt-2">
      <StatSection
        title={t('sectionStock')}
        cards={[
          <StatCard key="products"     label={t('totalProducts')}  value={String(data.totalProducts)} />,
          <StatCard key="outOfStock"   label={t('outOfStock')}     value={String(data.outOfStockCount)} accent={data.outOfStockCount > 0 ? 'red' : 'default'} />,
          <StatCard key="stockValue"   label={t('stockValue')}     value={formatPrice(data.totalStockValue)} accent="blue" />,
          <StatCard key="transactions" label={t('transactions')}   value={String(data.totalTransactions)} sub={t('transactionsSub', { stockIn: data.stockInQty, stockOut: data.stockOutQty })} />,
        ]}
      />

      <StatSection
        title={t('sectionRevenue')}
        cards={[
          <StatCard key="estRevenue"  label={t('estimatedRevenue')} value={formatPrice(data.estimatedRevenue)} sub={t('estimatedRevenueSub')} />,
          <StatCard key="actRevenue"  label={t('actualRevenue')}    value={formatPrice(data.actualRevenue)}    sub={t('actualRevenueSub')} accent="green" />,
          <StatCard key="totalCost"   label={t('totalCost')}        value={formatPrice(data.totalCost)}        accent="red" />,
        ]}
      />

      <StatSection
        title={t('sectionProfit')}
        cards={[
          <StatCard key="estProfit" label={t('estimatedProfit')} value={formatPrice(data.estimatedGrossProfit)} accent={data.estimatedGrossProfit >= 0 ? 'green' : 'red'} />,
          <StatCard key="actProfit" label={t('actualProfit')}    value={formatPrice(data.actualGrossProfit)}    accent={data.actualGrossProfit >= 0 ? 'green' : 'red'} />,
        ]}
      />

      <StatSection
        title={t('sectionDebt')}
        cards={[
          <StatCard key="debtCount"  label={t('openDebt')}  value={String(data.openDebtCount)}       accent={data.openDebtCount > 0 ? 'red' : 'default'} />,
          <StatCard key="debtAmount" label={t('totalDebt')} value={formatPrice(data.openDebtAmount)} accent={data.openDebtAmount > 0 ? 'red' : 'default'} />,
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function OverviewSkeleton() {
  return (
    <div className="px-4 pt-2 pb-8 space-y-5">
      {/* Hero card skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-24 rounded animate-shimmer" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted/50 px-4 py-3.5 space-y-1.5">
              <div className="h-2.5 w-20 rounded animate-shimmer" />
              <div className="h-5 w-28 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
      {[3, 2, 2].map((count, si) => (
        <div key={si} className="space-y-2">
          <div className="h-3 w-24 rounded animate-shimmer" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: count % 2 === 0 ? count : count - 1 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-muted/50 px-4 py-3.5 space-y-1.5">
                <div className="h-2.5 w-20 rounded animate-shimmer" />
                <div className="h-5 w-28 rounded animate-shimmer" />
              </div>
            ))}
          </div>
          {count % 2 !== 0 && (
            <div className="rounded-xl bg-muted/50 px-4 py-3.5 space-y-1.5">
              <div className="h-2.5 w-20 rounded animate-shimmer" />
              <div className="h-5 w-28 rounded animate-shimmer" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
