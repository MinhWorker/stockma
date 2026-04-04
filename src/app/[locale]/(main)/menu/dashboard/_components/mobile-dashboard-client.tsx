'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Package, TrendingUp, TrendingDown, CreditCard, Warehouse, ArrowLeftRight } from 'lucide-react';
import { MobileTransactionCard } from '../../inventory/_components/mobile-transaction-card';
import type { DashboardStats, TransactionRecord, InventorySummary } from '@/services/types';
import { formatPrice, cn } from '@/lib/utils';

interface Props {
  stats: DashboardStats;
  inventories: InventorySummary[];
  selectedInventoryId?: number;
}

export function MobileDashboardClient({ stats, inventories, selectedInventoryId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('dashboard');

  function selectInventory(id: number | undefined) {
    const params = new URLSearchParams();
    if (id) params.set('inv', String(id));
    router.push(`${pathname}?${params.toString()}`);
  }

  const today = new Date().toDateString();
  const txToday = stats.recentTransactions.filter((tx) => new Date(tx.createdAt).toDateString() === today).length;

  return (
    <div className="space-y-5 pb-8">
      {inventories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 scrollbar-none pb-1">
          <button onClick={() => selectInventory(undefined)}
            className={cn('shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors', !selectedInventoryId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
          >
            <Warehouse className="h-3 w-3" />
            {t('allInventories')}
          </button>
          {inventories.map((inv) => (
            <button key={inv.id} onClick={() => selectInventory(inv.id)}
              className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors', selectedInventoryId === inv.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
            >
              {inv.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 px-4">
        <StatCard icon={Package} iconBg="bg-violet-500" label={t('stats.totalProducts')} value={String(stats.totalProducts)}
          sub={stats.outOfStockCount > 0 ? t('stats.outOfStock', { count: stats.outOfStockCount }) : t('stats.inStock')}
          subColor={stats.outOfStockCount > 0 ? 'text-rose-500' : 'text-emerald-500'}
        />
        <StatCard icon={ArrowLeftRight} iconBg="bg-sky-500" label={t('stats.transactionsToday')} value={String(txToday)}
          sub={t('stats.recentCount', { count: stats.recentTransactions.length })}
        />
        <StatCard icon={Warehouse} iconBg="bg-emerald-500" label={t('stats.stockValue')} value={formatPrice(stats.totalStockValue)} wide />
        <StatCard icon={TrendingUp} iconBg="bg-blue-500" label={t('stats.actualRevenue')} value={formatPrice(stats.actualRevenue)}
          sub={t('stats.estimatedRevenueSub', { value: formatPrice(stats.estimatedRevenue) })}
        />
        <StatCard
          icon={stats.actualGrossProfit >= 0 ? TrendingUp : TrendingDown}
          iconBg={stats.actualGrossProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}
          label={t('stats.actualProfit')} value={formatPrice(stats.actualGrossProfit)}
          sub={t('stats.estimatedProfitSub', { value: formatPrice(stats.estimatedGrossProfit) })}
          valueColor={stats.actualGrossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
        />
        <StatCard icon={CreditCard} iconBg="bg-rose-500" label={t('stats.openDebt')}
          value={stats.openDebtCount > 0 ? formatPrice(stats.openDebtAmount) : '—'}
          sub={stats.openDebtCount > 0 ? t('stats.openDebtCount', { count: stats.openDebtCount }) : t('stats.noDebt')}
          subColor={stats.openDebtCount > 0 ? 'text-rose-500' : 'text-emerald-500'}
        />
      </div>

      <section className="mx-4 rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('chart7Days')}</p>
        <DailyBarChart data={stats.dailyChart} />
        <div className="flex gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />{t('chartStockIn')}</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-rose-500" />{t('chartStockOut')}</span>
        </div>
      </section>

      {stats.topProducts.length > 0 && (
        <section className="mx-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('topProducts')}</p>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/60">
            {stats.topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.productName}</p>
                  <p className="text-xs text-muted-foreground">{t('soldQty', { qty: p.soldQty })}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">{formatPrice(p.revenue)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <p className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('recentTransactions')}</p>
        {stats.recentTransactions.length === 0 ? (
          <p className="px-4 text-sm text-muted-foreground py-4">{t('emptyTransactions')}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {stats.recentTransactions.map((tx) => (
              <MobileTransactionCard key={tx.id} transaction={tx as TransactionRecord} onClick={() => {}} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  valueColor?: string;
  wide?: boolean;
}

function StatCard({ icon: Icon, iconBg, label, value, sub, subColor, valueColor, wide }: StatCardProps) {
  return (
    <div className={cn('rounded-2xl bg-muted/40 border border-border/60 p-3.5 space-y-2', wide && 'col-span-2')}>
      <div className="flex items-center gap-2">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', iconBg)}>
          <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2} />
        </div>
        <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      </div>
      <p className={cn('text-xl font-bold tabular-nums leading-tight', valueColor)}>{value}</p>
      {sub && <p className={cn('text-[10px]', subColor ?? 'text-muted-foreground')}>{sub}</p>}
    </div>
  );
}

interface DailyChartEntry { date: string; stockIn: number; stockOut: number; revenue: number }

function DailyBarChart({ data }: { data: DailyChartEntry[] }) {
  const maxQty = Math.max(...data.flatMap((d) => [d.stockIn, d.stockOut]), 1);

  const dayLabels = data.map((d) => {
    const date = new Date(d.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN', { weekday: 'short' });
  });

  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => {
        const inH = Math.round((d.stockIn / maxQty) * 100);
        const outH = Math.round((d.stockOut / maxQty) * 100);
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex items-end gap-0.5 h-20">
              <div className="flex-1 rounded-t-sm bg-emerald-500/80 transition-all" style={{ height: `${inH}%`, minHeight: inH > 0 ? 2 : 0 }} />
              <div className="flex-1 rounded-t-sm bg-rose-500/80 transition-all" style={{ height: `${outH}%`, minHeight: outH > 0 ? 2 : 0 }} />
            </div>
            <span className="text-[9px] text-muted-foreground text-center leading-tight w-full truncate">{dayLabels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}
