'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme-toggle';
import { LangSwitchButton } from '@/components/lang-switch-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import logo from '../../../../../public/web-app-manifest-192x192.png';
import { useSearchParams } from 'next/navigation';

const MENU_ROOT = '/menu';

// ---------------------------------------------------------------------------
// Segment → translation key map
// The last meaningful segment of the pathname is matched here.
// For report sub-pages the second-to-last segment is used (e.g. "overview").
// ---------------------------------------------------------------------------
const SEGMENT_TITLE: Record<string, { ns: string; key: string }> = {
  // Main sections
  dashboard:        { ns: 'dashboard',    key: 'title'            },
  products:         { ns: 'products',     key: 'title'            },
  new:              { ns: 'products',     key: 'addProduct'       },
  edit:             { ns: 'products',     key: 'editProduct'      },
  categories:       { ns: 'categories',   key: 'title'            },
  providers:        { ns: 'providers',    key: 'title'            },
  inventory:        { ns: 'inventory',    key: 'title'            },
  adjustment:       { ns: 'inventory',    key: 'tabs.adjustments' },
  'stock-in':       { ns: 'inventory',    key: 'tabs.stockIn'     },
  'stock-out':      { ns: 'inventory',    key: 'tabs.stockOut'    },
  order:            { ns: 'order',        key: 'title'            },
  reports:          { ns: 'reports',      key: 'title'            },
  activity:         { ns: 'activity',     key: 'title'            },
  settings:         { ns: 'settings',     key: 'title'            },
  // Report sub-pages (matched by segment name)
  overview:       { ns: 'reports.overview',      key: 'title'  },
  'stock-movement': { ns: 'reports.stockMovement', key: 'title' },
  debt:           { ns: 'reports.debt',          key: 'title'  },
};

// Segments that are dynamic params — skip them when resolving title
const DYNAMIC_SEGMENTS = new Set(['all', 'new', 'edit']);

function usePageTitle(): string | null {
  const pathname = usePathname();
  // translations — load all namespaces we might need
  const tDashboard   = useTranslations('dashboard');
  const tProducts    = useTranslations('products');
  const tCategories  = useTranslations('categories');
  const tProviders   = useTranslations('providers');
  const tInventory   = useTranslations('inventory');
  const tOrder       = useTranslations('order');
  const tReports     = useTranslations('reports');
  const tActivity    = useTranslations('activity');
  const tSettings    = useTranslations('settings');
  const tOverview    = useTranslations('reports.overview');
  const tMovement    = useTranslations('reports.stockMovement');
  const tDebt        = useTranslations('reports.debt');
  const tProducts2   = useTranslations('reports.products');
  const tProviders2  = useTranslations('reports.providers');

  const NS_MAP: Record<string, ReturnType<typeof useTranslations>> = {
    dashboard:             tDashboard,
    products:              tProducts,
    categories:            tCategories,
    providers:             tProviders,
    inventory:             tInventory,
    order:                 tOrder,
    reports:               tReports,
    activity:              tActivity,
    settings:              tSettings,
    'reports.overview':    tOverview,
    'reports.stockMovement': tMovement,
    'reports.debt':        tDebt,
    'reports.products':    tProducts2,
    'reports.providers':   tProviders2,
  };

  if (pathname === MENU_ROOT) return null;

  // Split path, drop locale prefix and empty strings
  const segments = pathname.split('/').filter(Boolean);
  // Drop locale segment (first segment is locale e.g. "vi")
  // pathname from usePathname() in next-intl already strips locale, so segments[0] = "menu"
  // Walk from the end to find the first known segment
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    // Skip numeric IDs and known dynamic values
    if (/^\d+$/.test(seg) || DYNAMIC_SEGMENTS.has(seg)) continue;
    const entry = SEGMENT_TITLE[seg];
    if (entry) {
      const t = NS_MAP[entry.ns];
      if (!t) return null;
      return t(entry.key as Parameters<typeof t>[0]);
    }
  }

  return null;
}

export function MainHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageTitle = usePageTitle();

  const isRoot = pathname === MENU_ROOT;
  const backTo = searchParams.get('back');

  function handleBack() {
    const opts = { transitionTypes: ['nav-back'] };
    if (backTo) router.push(backTo as Parameters<typeof router.push>[0], opts);
    else router.push(MENU_ROOT, opts);
  }

  return (
    <header
      style={{ viewTransitionName: 'site-header' }}
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border min-h-[56px]"
    >
      {/* Left: back button or logo */}
      <div className="flex items-center gap-3 min-w-0">
        {isRoot ? (
          <>
            <Image src={logo} alt="logo" height={28} width={28} className="shrink-0" />
            <span className="font-bold tracking-widest text-sm">STOCKMA</span>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {pageTitle && (
              <span className="text-base font-semibold truncate">{pageTitle}</span>
            )}
          </>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 shrink-0">
        <LangSwitchButton className="h-8 text-xs px-2" />
        <ThemeToggle />
      </div>
    </header>
  );
}
