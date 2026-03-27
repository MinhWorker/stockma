import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getTransactions } from '@/services/transaction.service';
import { PageHeader } from '@/components/layout/page-header';
import { InventoryClient } from '@/app/[locale]/(dashboard)/inventory/_components/inventory-client';

export default async function InventoryPage() {
  const t = await getTranslations('inventory');
  return (
    <div className="space-y-4">
      <PageHeader title={t('title')} />
      <Suspense
        fallback={<div className="h-96 rounded-xl border border-border animate-pulse bg-muted" />}
      >
        <InventoryData />
      </Suspense>
    </div>
  );
}

async function InventoryData() {
  const transactions = await getTransactions();
  return <InventoryClient initialData={transactions} />;
}
