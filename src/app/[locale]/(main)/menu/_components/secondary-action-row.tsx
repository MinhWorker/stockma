'use client';

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

  return (
    <section className="space-y-3">
      <div className="px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {sectionLabel}
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
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
                'flex flex-col items-center justify-center gap-2.5 rounded-2xl p-3',
                'bg-card border border-border/60 shadow-sm shadow-black/5',
                'hover:bg-accent hover:border-accent-foreground/10',
                'active:scale-95 transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', action.bgColor)}>
                <Icon className={cn('h-5 w-5', action.color)} strokeWidth={2} />
              </div>
              <p className="text-[11px] font-semibold text-center leading-[1.1] line-clamp-2 min-h-[2.2em] flex items-center justify-center">
                {action.label}
              </p>
            </LocaleLink>
          );
        })}
      </div>
    </section>
  );
}
