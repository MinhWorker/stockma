import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getTransactions } from '@/services/transaction.service';
import { PageHeader } from '@/components/layout/page-header';
import { TransactionsClient } from '@/app/[locale]/(dashboard)/transactions/_components/transactions-client';

export default async function TransactionsPage() {
  const t = await getTranslations('transactions');
  return (
    <div className="space-y-4">
      <PageHeader title={t('title')} />
      <Suspense
        fallback={<div className="h-96 rounded-xl border border-border animate-pulse bg-muted" />}
      >
        <TransactionsData />
      </Suspense>
    </div>
  );
}

async function TransactionsData() {
  const transactions = await getTransactions();
  return <TransactionsClient initialData={transactions} />;
}
