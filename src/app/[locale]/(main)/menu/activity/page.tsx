import { Suspense } from 'react';
import { getActivityLogs } from '@/services/activity.service';
import { getTranslations } from 'next-intl/server';
import { ActivityClient } from './_components/activity-client';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const logsPromise = getActivityLogs({ limit: 200 });
  const t = await getTranslations('activity');

  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityData logsPromise={logsPromise} />
      </Suspense>
    </div>
  );
}

async function ActivityData({
  logsPromise,
}: {
  logsPromise: ReturnType<typeof getActivityLogs>;
}) {
  const logs = await logsPromise;
  return <ActivityClient initialData={logs} />;
}

function ActivitySkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 rounded-full animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/5 rounded-md animate-shimmer" />
            <div className="h-2.5 w-2/5 rounded-md animate-shimmer" />
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="h-2.5 w-12 rounded-md animate-shimmer" />
            <div className="h-2.5 w-10 rounded-md animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
