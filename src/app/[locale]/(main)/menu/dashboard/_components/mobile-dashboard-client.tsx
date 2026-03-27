'use client';

import { useTranslations } from 'next-intl';
import { Package, AlertTriangle, DollarSign, ArrowLeftRight } from 'lucide-react';
import { MobileTransactionCard } from '../../inventory/_components/mobile-transaction-card';
import { StatRow } from './stat-row';
import type { DashboardStats, TransactionRecord } from '@/services/types';

interface Props {
  stats: DashboardStats;
}

// Pure presentational — no fetching, no loading state needed (data from server)
export function MobileDashboardClient({ stats }: Props) {
  const t = useTranslations('dashboard');

  const formattedValue = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(stats.totalStockValue);

  const today = new Date().toDateString();
  const txToday = stats.recentTransactions.filter(
    (tx) => new Date(tx.createdAt).toDateString() === today
  ).length;

  return (
    <div className="space-y-6 pb-4">
      {/* Stats */}
      <section>
        <div className="divide-y divide-border/60 rounded-2xl border border-border overflow-hidden mx-4">
          <StatRow
            icon={Package}
            label={t('stats.totalProducts')}
            value={stats.totalProducts}
            color="bg-violet-500"
          />
          <StatRow
            icon={AlertTriangle}
            label={t('stats.lowStockItems')}
            value={stats.lowStockCount}
            color="bg-amber-500"
          />
          <StatRow
            icon={DollarSign}
            label={t('stats.totalValue')}
            value={formattedValue}
            color="bg-emerald-500"
          />
          <StatRow
            icon={ArrowLeftRight}
            label={t('stats.transactionsToday')}
            value={txToday}
            color="bg-sky-500"
          />
        </div>
      </section>

      {/* Recent transactions */}
      <section className="space-y-2">
        <h2 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('recentTransactions')}
        </h2>
        {stats.recentTransactions.length === 0 ? (
          <p className="px-4 text-sm text-muted-foreground">{t('emptyTransactions')}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {stats.recentTransactions.map((tx) => (
              <MobileTransactionCard
                key={tx.id}
                transaction={tx as TransactionRecord}
                onClick={() => {}}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
