import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getDebtReport } from '@/services/report.service';
import { ReportFilters } from '../_components/report-filters';
import { InventoryBadge } from '../_components/inventory-badge';
import { formatPrice, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ inventoryId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function DebtReportPage({ params, searchParams }: Props) {
  const { inventoryId } = await params;
  const t = await getTranslations('reports.debt');
  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-1 text-xl font-semibold">{t('title')}</h1>
      <InventoryBadge inventoryId={inventoryId} />
      <ReportFilters />
      <Suspense fallback={<TableSkeleton />}>
        <DebtData inventoryId={inventoryId === 'all' ? undefined : Number(inventoryId)} dateFrom={(await searchParams).from} dateTo={(await searchParams).to} />
      </Suspense>
    </div>
  );
}

async function DebtData({ inventoryId, dateFrom, dateTo }: { inventoryId?: number; dateFrom?: string; dateTo?: string }) {
  const [rows, t] = await Promise.all([
    getDebtReport({ inventoryId, dateFrom, dateTo }),
    getTranslations('reports.debt'),
  ]);

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    open: { label: t('statusOpen'), color: 'text-rose-600 dark:text-rose-400' },
    closed: { label: t('statusClosed'), color: 'text-emerald-600 dark:text-emerald-400' },
    cancelled: { label: t('statusCancelled'), color: 'text-muted-foreground' },
  };

  const totalOpen = rows.filter((r) => r.status === 'open').reduce((s, r) => s + r.remainingAmount, 0);
  const openCount = rows.filter((r) => r.status === 'open').length;

  if (rows.length === 0) {
    return <p className="px-4 py-12 text-center text-sm text-muted-foreground">{t('emptyDesc')}</p>;
  }

  return (
    <div className="px-4 pb-8 pt-2 space-y-3">
      {openCount > 0 && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-rose-700 dark:text-rose-400">{t('openSummary', { count: openCount })}</p>
          <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{formatPrice(totalOpen)}</p>
        </div>
      )}
      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60 bg-card">
        {rows.map((row) => {
          const st = STATUS_LABEL[row.status] ?? STATUS_LABEL.open;
          return (
            <div key={row.id} className="px-4 py-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{row.debtorName}</p>
                <span className={`text-xs font-medium shrink-0 ${st.color}`}>{st.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(row.createdAt)}</span>
                <span>
                  {formatPrice(row.paidAmount)} / {formatPrice(row.totalAmount)}
                  {row.remainingAmount > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 ml-1">({t('remaining', { amount: formatPrice(row.remainingAmount) })})</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="px-4 pt-2 pb-8 space-y-3">
      <div className="h-12 rounded-xl animate-shimmer" />
      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-2/5 rounded animate-shimmer" />
              <div className="h-3 w-1/5 rounded animate-shimmer" />
            </div>
            <div className="h-2.5 w-3/5 rounded animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
