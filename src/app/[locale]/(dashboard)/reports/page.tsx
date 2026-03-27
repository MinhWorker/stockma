import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllProducts } from '@/services/product.service';
import { getTransactions } from '@/services/transaction.service';
import { PageHeader } from '@/components/layout/page-header';
import { ReportsClient } from '@/app/[locale]/(dashboard)/reports/_components/reports-client';

export default async function ReportsPage() {
  const t = await getTranslations('reports');
  return (
    <div className="space-y-4">
      <PageHeader title={t('title')} />
      <Suspense
        fallback={<div className="h-96 rounded-xl border border-border animate-pulse bg-muted" />}
      >
        <ReportsData />
      </Suspense>
    </div>
  );
}

async function ReportsData() {
  const [products, transactions] = await Promise.all([getAllProducts(), getTransactions()]);
  return <ReportsClient initialProducts={products} initialTransactions={transactions} />;
}
