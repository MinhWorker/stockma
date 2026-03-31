import { getTranslations } from 'next-intl/server';
import { getAllInventories } from '@/services/inventory.service';
import { getSession } from '@/lib/session';
import { getSubscriptionsByUserId } from '@/services/notification.service';
import { MobileSettingsClient } from './_components/mobile-settings-client';
import { InventorySection } from './_components/inventory-section';

export default async function MobileSettingsPage() {
  const [t, session, inventories] = await Promise.all([
    getTranslations('settings'),
    getSession(),
    getAllInventories(),
  ]);

  const prefs = session?.user?.id
    ? await getSubscriptionsByUserId(session.user.id)
    : null;

  const initialPrefs = prefs
    ? { lowStock: prefs.lowStock, stockOut: prefs.stockOut, newTransaction: prefs.newTransaction }
    : null;

  return (
    <div className="space-y-6 pb-6">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <InventorySection initialInventories={inventories} />
      <MobileSettingsClient initialPrefs={initialPrefs} />
    </div>
  );
}
