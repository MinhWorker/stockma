import { getTranslations } from 'next-intl/server';
import { ACTION_GROUPS } from './_config/quick-actions';
import { ActionGroup } from './_components/action-group';

export default async function MenuPage() {
  const t = await getTranslations('menu');

  const groupLabels: Record<string, string> = {
    warehouse: t('groups.warehouse'),
    catalog: t('groups.catalog'),
    analytics: t('groups.analytics'),
    system: t('groups.system'),
  };

  const actionLabels: Record<string, Record<string, { label: string; description: string }>> = {
    warehouse: {
      'stock-in': { label: t('actions.stockIn'), description: t('actions.stockInDesc') },
      'stock-out': { label: t('actions.stockOut'), description: t('actions.stockOutDesc') },
      adjustment: { label: t('actions.adjustment'), description: t('actions.adjustmentDesc') },
      inventory: { label: t('actions.inventory'), description: t('actions.inventoryDesc') },
    },
    catalog: {
      products: { label: t('actions.products'), description: t('actions.productsDesc') },
      'add-product': { label: t('actions.addProduct'), description: t('actions.addProductDesc') },
      categories: { label: t('actions.categories'), description: t('actions.categoriesDesc') },
      providers: { label: t('actions.providers'), description: t('actions.providersDesc') },
    },
    analytics: {
      dashboard: { label: t('actions.dashboard'), description: t('actions.dashboardDesc') },
      reports: { label: t('actions.reports'), description: t('actions.reportsDesc') },
    },
    system: {
      settings: { label: t('actions.settings'), description: t('actions.settingsDesc') },
    },
  };

  return (
    <div className="space-y-6 px-4 py-4">
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {ACTION_GROUPS.map((group) => (
        <ActionGroup
          key={group.groupKey}
          group={group}
          groupLabel={groupLabels[group.groupKey] ?? group.groupKey}
          actionLabels={actionLabels[group.groupKey] ?? {}}
        />
      ))}
    </div>
  );
}
