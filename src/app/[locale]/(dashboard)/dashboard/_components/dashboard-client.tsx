'use client';

import { useTranslations } from 'next-intl';
import { Package, AlertTriangle, DollarSign, ArrowLeftRight } from 'lucide-react';
import { StatCard } from '@/components/data-display/stat-card';
import { DataTable, type ColumnDef } from '@/components/data-display/data-table';
import { StatusBadge } from '@/components/data-display/status-badge';
import { EmptyState } from '@/components/data-display/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats, ProductSummary, TransactionRecord } from '@/services/types';

interface Props {
  stats: DashboardStats;
  lowStockProducts: ProductSummary[];
}

export function DashboardClient({ stats, lowStockProducts }: Props) {
  const t = useTranslations('dashboard');

  const today = new Date().toDateString();
  const transactionsToday = stats.recentTransactions.filter(
    (tx) => new Date(tx.createdAt).toDateString() === today
  ).length;

  const formattedTotalValue = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(stats.totalStockValue);

  const lowStockColumns: ColumnDef<ProductSummary>[] = [
    {
      key: 'name',
      header: t('columns.name'),
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    { key: 'category', header: t('columns.category'), cell: (row) => row.categoryName },
    { key: 'stock', header: t('columns.stock'), cell: (row) => row.stockQty },
    {
      key: 'status',
      header: t('columns.status'),
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const transactionColumns: ColumnDef<TransactionRecord>[] = [
    {
      key: 'date',
      header: t('columns.date'),
      cell: (row) =>
        new Date(row.createdAt).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
    },
    { key: 'type', header: t('columns.type'), cell: (row) => <StatusBadge status={row.type} /> },
    {
      key: 'product',
      header: t('columns.product'),
      cell: (row) => <span className="max-w-[160px] truncate block">{row.productName}</span>,
    },
    { key: 'qty', header: t('columns.qty'), cell: (row) => row.quantity },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Package} title={t('stats.totalProducts')} value={stats.totalProducts} />
        <StatCard
          icon={AlertTriangle}
          title={t('stats.lowStockItems')}
          value={stats.lowStockCount}
        />
        <StatCard icon={DollarSign} title={t('stats.totalValue')} value={formattedTotalValue} />
        <StatCard
          icon={ArrowLeftRight}
          title={t('stats.transactionsToday')}
          value={transactionsToday}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('lowStockProducts')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={lowStockColumns}
              data={lowStockProducts}
              getRowId={(row) => String(row.id)}
              emptyState={
                <EmptyState
                  icon={Package}
                  title={t('emptyLowStock')}
                  description={t('emptyLowStockDesc')}
                />
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('recentTransactions')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={transactionColumns}
              data={stats.recentTransactions}
              getRowId={(row) => String(row.id)}
              emptyState={
                <EmptyState
                  icon={ArrowLeftRight}
                  title={t('emptyTransactions')}
                  description={t('emptyTransactionsDesc')}
                />
              }
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
