'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Zap, ClipboardList, ChevronRight } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface OutboundPickerDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function OutboundPickerDrawer({ open, onClose }: OutboundPickerDrawerProps) {
  const t = useTranslations('menu');
  const router = useRouter();
  const pathname = usePathname();

  function navigate(href: string, intent?: string) {
    onClose();
    const params = new URLSearchParams({ back: pathname });
    if (intent) params.set('action', intent);
    router.push(`${href}?${params.toString()}` as Parameters<typeof router.push>[0]);
  }

  const options = [
    {
      icon: Zap,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      label: t('quickStockOut'),
      description: t('quickStockOutDesc'),
      onTap: () => navigate('/menu/stock-out', 'stock_out'),
    },
    {
      icon: ClipboardList,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      label: t('createOrder'),
      description: t('createOrderDesc'),
      onTap: () => navigate('/menu/order'),
    },
  ];

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base">{t('outboundPickerTitle')}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-2">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.onTap}
              className={cn(
                'w-full flex items-center gap-4 rounded-2xl px-4 py-4',
                'bg-card border border-border text-left',
                'hover:bg-accent hover:border-accent-foreground/20',
                'active:scale-[0.98] transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'min-h-[72px] cursor-pointer'
              )}
            >
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', opt.iconBg)}>
                <opt.icon className={cn('h-6 w-6', opt.iconColor)} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{opt.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
