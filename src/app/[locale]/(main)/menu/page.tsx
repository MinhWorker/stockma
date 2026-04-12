import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { BackPressGuard } from './_components/back-press-guard';
import { PageTransition } from '@/components/page-transition';
import { HeroSection } from './_components/hero-section';
import { PrimaryActionsSection } from './_components/primary-actions-section';
import { SecondaryActionRow } from './_components/secondary-action-row';
import { TertiaryActionList } from './_components/tertiary-action-list';

export default async function MenuPage() {
  const t = await getTranslations('menu');

  return (
    <PageTransition>
      <div className="px-4 py-4 space-y-6">
        <BackPressGuard message={t('backPressToExit')} />

        {/* Hero */}
        <Suspense fallback={<HeroSkeleton />}>
          <HeroSection />
        </Suspense>

        {/* Primary actions — thumb zone */}
        <PrimaryActionsSection
          stockInLabel={t('actions.stockIn')}
          stockInDesc={t('actions.stockInDesc')}
          stockOutLabel={t('actions.stockOut')}
          stockOutDesc={t('actions.stockOutDesc')}
        />

        {/* Secondary actions — horizontal scroll / expandable grid */}
        <SecondaryActionRow
          sectionLabel={t('groups.catalog')}
          actions={[
              { id: 'products',    href: '/menu/products',    label: t('actions.products'),    color: 'text-violet-600', bgColor: 'bg-violet-100' },
              { id: 'categories',  href: '/menu/categories',  label: t('actions.categories'),  color: 'text-pink-600',   bgColor: 'bg-pink-100'   },
              { id: 'providers',   href: '/menu/providers',   label: t('actions.providers'),   color: 'text-orange-600', bgColor: 'bg-orange-100' },
              { id: 'inventory',   href: '/menu/inventory',   label: t('actions.inventory'),   color: 'text-blue-600',   bgColor: 'bg-blue-100'   },
              { id: 'adjustment',  href: '/menu/adjustment',  label: t('actions.adjustment'),  color: 'text-amber-600',  bgColor: 'bg-amber-100'  },
            ]}
          />

        {/* Tertiary actions — text list */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            {t('groups.analytics')} &amp; {t('groups.system')}
          </h2>
          <TertiaryActionList
            actions={[
              { id: 'dashboard', href: '/menu/dashboard', label: t('actions.dashboard'), description: t('actions.dashboardDesc') },
              { id: 'reports',   href: '/menu/reports',   label: t('actions.reports'),   description: t('actions.reportsDesc')   },
              { id: 'activity',  href: '/menu/activity',  label: t('actions.activity'),  description: t('actions.activityDesc')  },
              { id: 'settings',  href: '/menu/settings',  label: t('actions.settings'),  description: t('actions.settingsDesc')  },
            ]}
          />
        </section>
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
