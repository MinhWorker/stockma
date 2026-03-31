import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getTransactions } from '@/services/transaction.service';
import { MobileInventoryClient } from './_components/mobile-inventory-client';

// async-suspense-boundaries: page renders title immediately,
// data streams in via Suspense
export default async function MobileInventoryPage() {
  const t = await getTranslations('inventory');
  const transactionsPromise = getTransactions();

  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <Suspense fallback={<InventorySkeleton />}>
        <InventoryData transactionsPromise={transactionsPromise} />
      </Suspense>
    </div>
  );
}

// Async server component — fetches and passes data down (server-parallel-fetching)
async function InventoryData({
  transactionsPromise,
}: {
  transactionsPromise: ReturnType<typeof getTransactions>;
}) {
  const transactions = await transactionsPromise;
  return <MobileInventoryClient initialData={transactions} />;
}

function InventorySkeleton() {
return (
    <div className="space-y-px bg-background">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <div className="h-10 w-10 rounded-full animate-shimmer bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded animate-shimmer bg-muted" />
            <div className="h-2.5 w-1/2 rounded animate-shimmer bg-muted" />
          </div>
          <div className="h-3 w-8 rounded animate-shimmer bg-muted" />
        </div>
      ))}
    </div>
  );
}
