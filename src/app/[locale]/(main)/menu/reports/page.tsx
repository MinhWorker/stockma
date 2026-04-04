import { getAllInventories } from '@/services/inventory.service';
import { getTranslations } from 'next-intl/server';
import { ReportsHub } from './_components/reports-hub';
import { Suspense } from 'react';
import { PageTransition } from '@/components/page-transition';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ inv?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const { inv } = await searchParams;
  // Start fetch immediately — don't await, let Suspense handle the loading state
  const inventoriesPromise = getAllInventories();
  const t = await getTranslations('reports');

  return (
    <PageTransition>
      <div className="space-y-0">
        <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
        <Suspense fallback={<ReportsHubSkeleton />}>
          <ReportsHubData
            inventoriesPromise={inventoriesPromise}
            initialInventoryId={inv ? Number(inv) : undefined}
          />
        </Suspense>
      </div>
    </PageTransition>
  );
}

async function ReportsHubData({
  inventoriesPromise,
  initialInventoryId,
}: {
  inventoriesPromise: ReturnType<typeof getAllInventories>;
  initialInventoryId?: number;
}) {
  const inventories = await inventoriesPromise;
  return <ReportsHub inventories={inventories} initialInventoryId={initialInventoryId} />;
}

function ReportsHubSkeleton() {
  return (
    <div className="px-4 space-y-3 pt-2">
      <div className="h-10 w-full rounded-xl animate-shimmer" />
      <div className="h-10 w-2/3 rounded-xl animate-shimmer" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 w-full rounded-xl animate-shimmer" />
        ))}
      </div>
    </div>
  );
}
