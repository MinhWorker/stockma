import { getTranslations } from 'next-intl/server';
import { StockInClient } from './_components/stock-in-client';

export default async function StockInPage() {
  const t = await getTranslations('inventory');
  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('tabs.stockIn')}</h1>
      <StockInClient />
    </div>
  );
}
