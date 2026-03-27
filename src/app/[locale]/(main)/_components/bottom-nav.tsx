'use client';

import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { LayoutGrid, Warehouse, Package, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const NAV_ITEMS = [
  { href: '/menu', icon: LayoutGrid, labelKey: 'menu' },
  { href: '/menu/inventory', icon: Warehouse, labelKey: 'inventory' },
  { href: '/menu/products', icon: Package, labelKey: 'products' },
  { href: '/menu/reports', icon: BarChart3, labelKey: 'reports' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 border-t border-border bg-background/90 backdrop-blur-sm">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href || (href !== '/menu' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-5 w-5', isActive && 'stroke-[2.25]')}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span className="text-[10px] font-medium leading-none">
                {labelKey === 'menu' ? 'Menu' : t(labelKey as 'inventory' | 'products' | 'reports')}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
