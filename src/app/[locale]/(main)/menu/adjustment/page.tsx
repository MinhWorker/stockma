import { getTranslations } from 'next-intl/server';
import { AdjustmentClient } from './_components/adjustment-client';

export default async function AdjustmentPage() {
  const t = await getTranslations('inventory');
  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('tabs.adjustments')}</h1>
      <AdjustmentClient />
    </div>
  );
}
