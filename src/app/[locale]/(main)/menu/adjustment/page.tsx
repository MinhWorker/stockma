import { getTranslations } from 'next-intl/server';
import { AdjustmentClient } from './_components/adjustment-client';

export default async function AdjustmentPage() {
  const t = await getTranslations('inventory');
  return (
    <div className="space-y-0">
      <AdjustmentClient />
    </div>
  );
}
