import { getAllInventories } from '@/services/inventory.service';
import { getTranslations } from 'next-intl/server';
import { ReportsHub } from './_components/reports-hub';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ inv?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const { inv } = await searchParams;
  const [inventories, t] = await Promise.all([getAllInventories(), getTranslations('reports')]);
  return (
    <div className="space-y-0">
      <h1 className="px-4 pt-1 pb-3 text-xl font-semibold">{t('title')}</h1>
      <ReportsHub inventories={inventories} initialInventoryId={inv ? Number(inv) : undefined} />
    </div>
  );
}
