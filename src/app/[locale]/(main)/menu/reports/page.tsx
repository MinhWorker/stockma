import { getTranslations } from 'next-intl/server';
import { MobileReportsClient } from './_components/mobile-reports-client';

export default async function MobileReportsPage() {
  const t = await getTranslations('reports');
  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <MobileReportsClient />
    </div>
  );
}
