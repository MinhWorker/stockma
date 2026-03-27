import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getDashboardStats } from '@/services/dashboard.service';
import { MobileDashboardClient } from './_components/mobile-dashboard-client';

// async-parallel: translations and title render immediately,
// stats stream in via Suspense
export default async function MobileDashboardPage() {
  const t = await getTranslations('dashboard');
  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}

async function DashboardData() {
  const stats = await getDashboardStats();
  return <MobileDashboardClient stats={stats} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      <section>
        <div className="divide-y divide-border/60 rounded-2xl border border-border overflow-hidden mx-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-10 w-10 rounded-xl animate-shimmer shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-24 rounded animate-shimmer" />
                <div className="h-5 w-16 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-2">
        <div className="px-4 h-3 w-32 rounded animate-shimmer" />
        <div className="space-y-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-10 w-10 rounded-full animate-shimmer shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded animate-shimmer" />
                <div className="h-2.5 w-1/3 rounded animate-shimmer" />
              </div>
              <div className="h-3 w-8 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
