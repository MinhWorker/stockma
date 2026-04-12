'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { BarChart3, TrendingUp, Package, Truck, CreditCard, Warehouse, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { InventorySummary } from '@/services/types';
import { formatPrice, cn } from '@/lib/utils';
import { useQueryParams } from '@/hooks/use-query-params';

interface Props {
  inventories: InventorySummary[];
  initialInventoryId?: number;
}

export function ReportsHub({ inventories, initialInventoryId }: Props) {
  const router = useRouter();
  const { set, remove, searchParams } = useQueryParams();
  const t = useTranslations('reports');
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | 'all'>(initialInventoryId ?? 'all');
  const [pickerOpen, setPickerOpen] = useState(false);

  const REPORT_TYPES = [
    { id: 'overview',       label: t('types.overview'),      description: t('types.overviewDesc'),      icon: BarChart3,  color: 'bg-sky-500'    },
    { id: 'stock-movement', label: t('types.stockMovement'), description: t('types.stockMovementDesc'), icon: TrendingUp, color: 'bg-emerald-500' },
    { id: 'products',       label: t('types.products'),      description: t('types.productsDesc'),      icon: Package,    color: 'bg-violet-500'  },
    { id: 'providers',      label: t('types.providers'),     description: t('types.providersDesc'),     icon: Truck,      color: 'bg-orange-500'  },
    { id: 'debt',           label: t('types.debt'),          description: t('types.debtDesc'),          icon: CreditCard, color: 'bg-rose-500'    },
  ] as const;

  function navigate(reportId: string) {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const backParams = new URLSearchParams();
    if (selectedInventoryId !== 'all') backParams.set('inv', String(selectedInventoryId));
    if (from) backParams.set('from', from);
    if (to) backParams.set('to', to);
    const backUrl = `/menu/reports${backParams.size > 0 ? `?${backParams.toString()}` : ''}`;
    const subParams = new URLSearchParams({ back: backUrl });
    if (from) subParams.set('from', from);
    if (to) subParams.set('to', to);
    router.push(`/menu/reports/${selectedInventoryId}/${reportId}?${subParams.toString()}` as Parameters<typeof router.push>[0]);
  }

  function selectInventory(id: number | 'all') {
    setSelectedInventoryId(id);
    if (id === 'all') remove('inv'); else set('inv', String(id));
    setPickerOpen(false);
  }

  const selectedInv = selectedInventoryId !== 'all'
    ? inventories.find((i) => i.id === selectedInventoryId)
    : null;

  const selectedName = selectedInv?.name ?? t('allInventoriesLabel');

  return (
    <div className="space-y-5 px-4 py-2 pb-8">

      {/* ── Warehouse picker ── */}
      {inventories.length > 0 && (
        <>
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventorySection')}</p>
            <button
              onClick={() => setPickerOpen(true)}
              className={cn(
                'flex w-full items-center justify-between rounded-2xl px-4 py-3',
                'bg-muted/40 border border-border/60',
                'hover:bg-muted/70 active:scale-[0.99] transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Warehouse className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{t('inventorySection')}</p>
                  <p className="text-sm font-semibold truncate leading-tight">{selectedName}</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
            </button>

            {/* Selected inventory quick stats */}
            {selectedInv && (
              <div className="rounded-xl bg-muted/40 border border-border/60 px-4 py-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('products.title')}</p>
                  <p className="text-sm font-semibold tabular-nums">{selectedInv.totalProducts}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('overview.stockValue')}</p>
                  <p className="text-sm font-semibold tabular-nums">{formatPrice(selectedInv.totalStockValue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{t('overview.outOfStock')}</p>
                  <p className="text-sm font-semibold tabular-nums">{selectedInv.outOfStockCount}</p>
                </div>
              </div>
            )}
          </section>

          <Drawer open={pickerOpen} onOpenChange={(v) => !v && setPickerOpen(false)}>
            <DrawerContent>
              <DrawerHeader className="pb-2">
                <DrawerTitle className="text-base">{t('inventorySection')}</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6 space-y-2">
                <InventoryOption
                  label={t('allInventoriesLabel')}
                  isSelected={selectedInventoryId === 'all'}
                  onSelect={() => selectInventory('all')}
                />
                {inventories.map((inv) => (
                  <InventoryOption
                    key={inv.id}
                    label={inv.name}
                    isSelected={selectedInventoryId === inv.id}
                    onSelect={() => selectInventory(inv.id)}
                  />
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}

      {/* ── Report type list ── */}
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('reportTypeSection')}</p>
        <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60 bg-card">
          {REPORT_TYPES.map(({ id, label, description, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-muted transition-colors min-h-[64px]"
            >
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color)}>
                <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventory option row inside the drawer
// ---------------------------------------------------------------------------
function InventoryOption({ label, isSelected, onSelect }: { label: string; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3.5 rounded-2xl px-4 py-4',
        'border transition-all duration-150 cursor-pointer text-left active:scale-[0.98]',
        isSelected ? 'bg-primary/5 border-primary/30' : 'bg-card border-border hover:bg-accent'
      )}
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', isSelected ? 'bg-primary/10' : 'bg-muted')}>
        <Warehouse className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} strokeWidth={1.75} />
      </div>
      <p className={cn('flex-1 text-sm font-medium', isSelected && 'text-primary')}>{label}</p>
      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
    </button>
  );
}
