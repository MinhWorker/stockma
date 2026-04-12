'use client';

import { useState } from 'react';
import { usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LocaleLink } from '@/components/locale-link';
import { cn } from '@/lib/utils';
import {
  Package,
  Tag,
  Truck,
  Warehouse,
  SlidersHorizontal,
  ClipboardList,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  products: Package,
  categories: Tag,
  providers: Truck,
  inventory: Warehouse,
  adjustment: SlidersHorizontal,
  order: ClipboardList,
};

interface SecondaryAction {
  id: string;
  href: string;
  label: string;
  color: string;
  bgColor: string;
}

interface SecondaryActionRowProps {
  actions: SecondaryAction[];
  sectionLabel: string;
}

export function SecondaryActionRow({ actions, sectionLabel }: SecondaryActionRowProps) {
  const pathname = usePathname();
  const t = useTranslations('menu');
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {sectionLabel}
        </h2>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer"
        >
          {expanded ? t('showLess') : t('showAll')}
        </button>
      </div>

      <div
        className={cn(
          expanded
            ? 'grid grid-cols-4 gap-3'
            : 'flex gap-3 overflow-x-auto pb-1 scrollbar-none'
        )}
      >
        {actions.map((action) => {
          const params = new URLSearchParams({ back: pathname });
          const fullHref = `${action.href}?${params.toString()}`;
          const Icon = ICON_MAP[action.id] ?? HelpCircle;

          return (
            <LocaleLink
              key={action.id}
              href={fullHref}
              transitionTypes={['nav-forward']}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl px-2 py-3.5',
                'border border-border bg-card',
                'hover:bg-accent hover:border-accent-foreground/20',
                'active:scale-95 transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                !expanded && 'shrink-0 min-w-[76px] px-4'
              )}
            >
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', action.bgColor)}>
                <Icon className={cn('h-5 w-5', action.color)} strokeWidth={1.75} />
              </div>
              <p className="text-xs font-medium text-center leading-tight">{action.label}</p>
            </LocaleLink>
          );
        })}
      </div>
    </section>
  );
}
