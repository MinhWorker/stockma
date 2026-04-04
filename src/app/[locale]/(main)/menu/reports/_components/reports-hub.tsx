'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { BarChart3, TrendingUp, Package, Truck, CreditCard, Warehouse, ChevronRight } from 'lucide-react';
import type { InventorySummary } from '@/services/types';
import { formatPrice } from '@/lib/utils';
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

  const REPORT_TYPES = [
    { id: 'overview', label: t('types.overview'), description: t('types.overviewDesc'), icon: BarChart3, color: 'bg-sky-500' },
    { id: 'stock-movement', label: t('types.stockMovement'), description: t('types.stockMovementDesc'), icon: TrendingUp, color: 'bg-emerald-500' },
    { id: 'products', label: t('types.products'), description: t('types.productsDesc'), icon: Package, color: 'bg-violet-500' },
    { id: 'providers', label: t('types.providers'), description: t('types.providersDesc'), icon: Truck, color: 'bg-orange-500' },
    { id: 'debt', label: t('types.debt'), description: t('types.debtDesc'), icon: CreditCard, color: 'bg-rose-500' },
  ] as const;

  function navigate(reportId: string) {
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build back URL preserving inv + date params
    const backParams = new URLSearchParams();
    if (selectedInventoryId !== 'all') backParams.set('inv', String(selectedInventoryId));
    if (from) backParams.set('from', from);
    if (to) backParams.set('to', to);
    const backUrl = `/menu/reports${backParams.size > 0 ? `?${backParams.toString()}` : ''}`;

    // Build sub-page URL with date params pre-filled
    const subParams = new URLSearchParams();
    subParams.set('back', backUrl);
    if (from) subParams.set('from', from);
    if (to) subParams.set('to', to);

    router.push(
      `/menu/reports/${selectedInventoryId}/${reportId}?${subParams.toString()}` as Parameters<typeof router.push>[0]
    );
  }

  function selectInventory(id: number | 'all') {
    setSelectedInventoryId(id);
    if (id === 'all') remove('inv');
    else set('inv', String(id));
  }

  const selectedInv = selectedInventoryId !== 'all' ? inventories.find((i) => i.id === selectedInventoryId) : null;

  return (
    <div className="space-y-5 px-4 py-2 pb-8">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('inventorySection')}</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => selectInventory('all')}
            className={'shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ' + (selectedInventoryId === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
          >
            <Warehouse className="h-3 w-3" />
            {t('allInventoriesLabel')}
          </button>
          {inventories.map((inv) => (
            <button key={inv.id} onClick={() => selectInventory(inv.id)}
              className={'shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ' + (selectedInventoryId === inv.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
            >
              {inv.name}
            </button>
          ))}
        </div>
        {selectedInv && (
          <div className="rounded-xl bg-muted/50 px-4 py-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">{t('products.title')}</p>
              <p className="text-sm font-semibold">{selectedInv.totalProducts}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('overview.stockValue')}</p>
              <p className="text-sm font-semibold">{formatPrice(selectedInv.totalStockValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('overview.outOfStock')}</p>
              <p className="text-sm font-semibold">{selectedInv.outOfStockCount}</p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('reportTypeSection')}</p>
        <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60 bg-card">
          {REPORT_TYPES.map(({ id, label, description, icon: Icon, color }) => (
            <button key={id} onClick={() => navigate(id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted transition-colors">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-4 w-4 text-white" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
