import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ACTION_GROUPS } from './_config/quick-actions';
import { ActionGroup } from './_components/action-group';
import { BackPressGuard } from './_components/back-press-guard';
import { PageTransition } from '@/components/page-transition';
import { HeroSection } from './_components/hero-section';

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
      order: { label: t('actions.order'), description: t('actions.orderDesc') },
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
      activity: { label: t('actions.activity'), description: t('actions.activityDesc') },
      settings: { label: t('actions.settings'), description: t('actions.settingsDesc') },
    },
  };

  return (
    <PageTransition>
      <div className="space-y-6 px-4 py-4">
        <BackPressGuard message={t('backPressToExit')} />
        <Suspense fallback={<HeroSkeleton />}>
          <HeroSection />
        </Suspense>
        {ACTION_GROUPS.map((group) => (
          <ActionGroup
            key={group.groupKey}
            group={group}
            groupLabel={groupLabels[group.groupKey] ?? group.groupKey}
            actionLabels={actionLabels[group.groupKey] ?? {}}
          />
        ))}
      </div>
    </PageTransition>
  );
}

function HeroSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-muted/40 border border-border/60 px-4 py-3.5">
      <div className="space-y-2 flex-1">
        <div className="h-2.5 w-16 rounded animate-shimmer" />
        <div className="h-4 w-28 rounded animate-shimmer" />
        <div className="h-2.5 w-36 rounded animate-shimmer" />
      </div>
      <div className="h-16 w-16 rounded-full animate-shimmer shrink-0 ml-4" />
    </div>
  );
}
