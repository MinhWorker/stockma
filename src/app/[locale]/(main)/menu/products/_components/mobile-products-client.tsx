'use client';

import { useCallback, useMemo } from 'react';
import { Search, X, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import type { ProductSummary, ProductStatus } from '@/services/types';
import { MobileProductCard } from './mobile-product-card';
import { ProductDetailDrawer } from './product-detail-drawer';
import { MobileProductFormDrawer } from './mobile-product-form-drawer';
import { Fab } from '../../inventory/_components/fab';
import { ProductsProvider, useProducts } from './products-context';

type StatusFilter = 'all' | ProductStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Còn hàng' },
  { value: 'low_stock', label: 'Sắp hết' },
  { value: 'out_of_stock', label: 'Hết hàng' },
];

interface Props {
  initialData: ProductSummary[];
  openAddForm?: boolean;
}

// Root export — wraps with provider (state-lift-state)
export function MobileProductsClient({ initialData, openAddForm }: Props) {
  return (
    <ProductsProvider openAddForm={openAddForm}>
      <ProductsShell initialData={initialData} />
    </ProductsProvider>
  );
}

// Inner shell — consumes context, no prop drilling
function ProductsShell({ initialData }: { initialData: ProductSummary[] }) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const { state, actions } = useProducts();

  const filtered = useMemo(() => {
    console.log('[ProductsShell] recomputing filtered, initialData length:', initialData.length, 'first item:', initialData[0]?.name, initialData[0]?.price);
    const q = state.search.toLowerCase();
    return initialData.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q);
      const matchStatus = state.statusFilter === 'all' || p.status === state.statusFilter;
      return matchSearch && matchStatus;
    });
  }, [initialData, state.search, state.statusFilter]);

  const hasFilters = state.search !== '' || state.statusFilter !== 'all';

  const handleDetailClose = useCallback((open: boolean) => { if (!open) actions.closeDetail(); }, [actions]);
  const handleFormClose = useCallback((open: boolean) => { if (!open) actions.closeForm(); }, [actions]);
  const handleFormSuccess = useCallback(() => actions.closeForm(), [actions]);

  return (
    <>
      {/* Search */}
      <div className="relative px-4 py-2">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={state.inputValue}
          onChange={(e) => actions.setInputValue(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-9 pr-9 bg-muted border-0 rounded-xl h-10"
        />
        {state.inputValue && (
          <button
            onClick={() => actions.setInputValue('')}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => actions.setStatusFilter(tab.value)}
            className={
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ' +
              (state.statusFilter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80')
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="px-4 pb-1 text-xs text-muted-foreground">{filtered.length} sản phẩm</p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{hasFilters ? t('emptyFilterTitle') : t('emptyTitle')}</p>
            <p className="text-sm text-muted-foreground">
              {hasFilters ? t('emptyFilterDesc') : t('emptyDesc')}
            </p>
          </div>
          {hasFilters && (
            <button
              onClick={actions.clearFilters}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {tCommon('clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((p) => (
            <MobileProductCard key={p.id} product={p} onClick={() => actions.openDetail(p)} />
          ))}
        </div>
      )}

      <Fab onClick={actions.openAdd} label={t('addProduct')} />

      <ProductDetailDrawer
        product={state.selectedProduct}
        open={state.detailOpen}
        onOpenChange={handleDetailClose}
        onEdit={actions.openEdit}
      />

      <MobileProductFormDrawer
        open={state.formOpen}
        onOpenChange={handleFormClose}
        product={state.editingProduct}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}
