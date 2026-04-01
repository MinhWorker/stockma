import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getAllInventories } from '@/services/inventory.service';
import { getSession } from '@/lib/session';
import { getSubscriptionsByUserId } from '@/services/notification.service';
import { MobileSettingsClient } from './_components/mobile-settings-client';
import { InventorySection } from './_components/inventory-section';
import { DangerZone } from './_components/danger-zone';

export default async function MobileSettingsPage() {
  const t = await getTranslations('settings');

  const inventoriesPromise = getAllInventories();
  const prefsPromise = getSession().then((session) =>
    session?.user?.id ? getSubscriptionsByUserId(session.user.id) : null
  );

  return (
    <div className="space-y-6 pb-6">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <Suspense fallback={<InventorySkeleton />}>
        <InventoryData inventoriesPromise={inventoriesPromise} />
      </Suspense>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsData prefsPromise={prefsPromise} />
      </Suspense>
      {process.env.NODE_ENV === 'development' && <DangerZone />}
    </div>
  );
}

async function InventoryData({
  inventoriesPromise,
}: {
  inventoriesPromise: ReturnType<typeof getAllInventories>;
}) {
  const inventories = await inventoriesPromise;
  return <InventorySection initialInventories={inventories} />;
}

async function SettingsData({
  prefsPromise,
}: {
  prefsPromise: Promise<Awaited<ReturnType<typeof getSubscriptionsByUserId>> | null>;
}) {
  const prefs = await prefsPromise;
  const initialPrefs = prefs
    ? { lowStock: prefs.lowStock, stockOut: prefs.stockOut, newTransaction: prefs.newTransaction }
    : null;
  return <MobileSettingsClient initialPrefs={initialPrefs} />;
}

function InventorySkeleton() {
  return (
    <div className="space-y-px">
      {/* Section header */}
      <div className="px-4 pb-1 pt-2">
        <div className="h-3 w-28 rounded-md animate-shimmer" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded-md animate-shimmer" />
            <div className="h-2.5 w-1/4 rounded-md animate-shimmer" />
          </div>
          <div className="flex gap-1.5 shrink-0">
            <div className="h-8 w-8 rounded-lg animate-shimmer" />
            <div className="h-8 w-8 rounded-lg animate-shimmer" />
          </div>
        </div>
      ))}
      <div className="px-4 pt-2">
        <div className="h-9 w-full rounded-lg animate-shimmer" />
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-px">
      {/* Section header */}
      <div className="px-4 pb-1 pt-2">
        <div className="h-3 w-24 rounded-md animate-shimmer" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="space-y-1.5 flex-1 mr-4">
            <div className="h-3 w-2/5 rounded-md animate-shimmer" />
            <div className="h-2.5 w-3/5 rounded-md animate-shimmer" />
          </div>
          {/* Toggle */}
          <div className="h-6 w-11 rounded-full animate-shimmer shrink-0" />
        </div>
      ))}
      <div className="px-4 pt-3 space-y-2">
        <div className="h-9 w-full rounded-lg animate-shimmer" />
        <div className="h-9 w-full rounded-lg animate-shimmer" />
      </div>
    </div>
  );
}
