import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getDashboardStats } from '@/services/dashboard.service';
import { getLowStockProducts } from '@/services/product.service';
import { PageHeader } from '@/components/layout/page-header';
import { DashboardClient } from '@/app/[locale]/(dashboard)/dashboard/_components/dashboard-client';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}

async function DashboardData() {
  // server-parallel-fetching: both run concurrently
  const [stats, lowStockProducts] = await Promise.all([getDashboardStats(), getLowStockProducts()]);
  return <DashboardClient stats={stats} lowStockProducts={lowStockProducts} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border animate-pulse bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl border border-border animate-pulse bg-muted" />
        <div className="h-64 rounded-xl border border-border animate-pulse bg-muted" />
      </div>
    </div>
  );
}
