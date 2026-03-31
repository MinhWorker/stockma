import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getTransactions } from '@/services/transaction.service';
import { MobileInventoryClient } from './_components/mobile-inventory-client';

export const dynamic = 'force-dynamic';

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
    <div className="space-y-px">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {/* Avatar / type icon */}
          <div className="h-10 w-10 rounded-full animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            {/* Product name */}
            <div className="h-3 w-3/5 rounded-md animate-shimmer" />
            {/* Date + type badge */}
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-16 rounded-md animate-shimmer" />
              <div className="h-4 w-12 rounded-full animate-shimmer" />
            </div>
          </div>
          {/* Quantity */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="h-3 w-8 rounded-md animate-shimmer" />
            <div className="h-2.5 w-12 rounded-md animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
