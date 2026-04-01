import { Suspense } from 'react';
import { getDashboardStats } from '@/services/dashboard.service';
import { getAllInventories } from '@/services/inventory.service';
import { MobileDashboardClient } from './_components/mobile-dashboard-client';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ inv?: string }>;
}

export default async function MobileDashboardPage({ searchParams }: Props) {
  const { inv } = await searchParams;
  const inventoryId = inv ? Number(inv) : undefined;

  const [inventories] = await Promise.all([
    getAllInventories(),
  ]);
  const statsPromise = getDashboardStats(inventoryId);

  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">Tổng quan</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData statsPromise={statsPromise} inventories={inventories} selectedInventoryId={inventoryId} />
      </Suspense>
    </div>
  );
}

async function DashboardData({
  statsPromise,
  inventories,
  selectedInventoryId,
}: {
  statsPromise: ReturnType<typeof getDashboardStats>;
  inventories: Awaited<ReturnType<typeof getAllInventories>>;
  selectedInventoryId?: number;
}) {
  const stats = await statsPromise;
  return <MobileDashboardClient stats={stats} inventories={inventories} selectedInventoryId={selectedInventoryId} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 pb-8 px-4">
      {/* Inventory chips */}
      <div className="flex gap-2 -mx-4 px-4 overflow-x-auto scrollbar-none py-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-full animate-shimmer shrink-0" />
        ))}
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-muted/50 p-4 space-y-2">
            <div className="h-2.5 w-16 rounded animate-shimmer" />
            <div className="h-6 w-24 rounded animate-shimmer" />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="rounded-2xl border border-border p-4 space-y-3">
        <div className="h-3 w-28 rounded animate-shimmer" />
        <div className="flex items-end gap-1.5 h-24">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-t animate-shimmer" style={{ height: `${40 + i * 8}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
