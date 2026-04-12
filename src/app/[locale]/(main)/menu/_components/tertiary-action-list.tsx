'use client';

import { usePathname } from '@/i18n/routing';
import { LocaleLink } from '@/components/locale-link';
import { ChevronRight, LayoutDashboard, BarChart3, History, Settings, HelpCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  reports: BarChart3,
  activity: History,
  settings: Settings,
};

const COLOR_MAP: Record<string, string> = {
  dashboard: 'text-sky-600',
  reports: 'text-teal-600',
  activity: 'text-purple-600',
  settings: 'text-slate-600',
};

interface TertiaryAction {
  id: string;
  href: string;
  label: string;
  description: string;
}

interface TertiaryActionListProps {
  actions: TertiaryAction[];
}

export function TertiaryActionList({ actions }: TertiaryActionListProps) {
  const pathname = usePathname();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
      {actions.map((action) => {
        const params = new URLSearchParams({ back: pathname });
        const fullHref = `${action.href}?${params.toString()}`;
        const Icon = ICON_MAP[action.id] ?? HelpCircle;
        const iconColor = COLOR_MAP[action.id] ?? 'text-muted-foreground';

        return (
          <LocaleLink
            key={action.id}
            href={fullHref}
            transitionTypes={['nav-forward']}
            className={cn(
              'flex items-center gap-3.5 px-4 py-3.5',
              'hover:bg-accent active:bg-accent/80',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60">
              <Icon className={cn('h-4 w-4', iconColor)} strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{action.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          </LocaleLink>
        );
      })}
    </div>
  );
}
