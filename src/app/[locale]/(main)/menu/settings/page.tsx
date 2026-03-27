import { getTranslations } from 'next-intl/server';
import { MobileSettingsClient } from './_components/mobile-settings-client';

export default async function MobileSettingsPage() {
  const t = await getTranslations('settings');
  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <MobileSettingsClient />
    </div>
  );
}
