'use client';

import { usePathname } from '@/i18n/routing';
import { LocaleLink } from '@/components/locale-link';
import { cn } from '@/lib/utils';
import type { QuickAction } from '../_config/quick-actions';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Warehouse,
  Package,
  PackagePlus,
  LayoutDashboard,
  BarChart3,
  ArrowLeftRight,
  Settings,
  Tag,
  Truck,
  History,
  ClipboardList,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

const ICON_BY_ID: Record<string, LucideIcon> = {
  'stock-in': ArrowDownToLine,
  'stock-out': ArrowUpFromLine,
  adjustment: SlidersHorizontal,
  order: ClipboardList,
  inventory: Warehouse,
  products: Package,
  'add-product': PackagePlus,
  categories: Tag,
  providers: Truck,
  dashboard: LayoutDashboard,
  reports: BarChart3,
  transactions: ArrowLeftRight,
  settings: Settings,
  activity: History,
};

interface ActionCardProps {
  action: QuickAction;
  label: string;
  description: string;
}

export function ActionCard({ action, label, description }: ActionCardProps) {
  const Icon = ICON_BY_ID[action.id] ?? HelpCircle;
  const pathname = usePathname();

  const params = new URLSearchParams({ back: pathname });
  if (action.intent) params.set('action', action.intent);
  const href = `${action.href}?${params.toString()}`;

  return (
    <LocaleLink
      href={href}
      transitionTypes={['nav-forward']}
      className={cn(
        'group flex flex-col items-center gap-2 rounded-2xl p-4',
        'bg-card border border-border',
        'hover:bg-accent hover:border-accent-foreground/20',
        'active:scale-95 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', action.color)}>
        <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium leading-tight">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight line-clamp-2">
          {description}
        </p>
      </div>
    </LocaleLink>
  );
}
