import { getTranslations } from 'next-intl/server';
import { StockOutClient } from './_components/stock-out-client';

export default async function StockOutPage() {
  const t = await getTranslations('inventory');
  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('tabs.stockOut')}</h1>
      <StockOutClient />
    </div>
  );
}
