'use client';

import { useCallback, useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MobileSearchBar } from '@/components/forms/mobile-search-bar';
import { normalizeSearchText } from '@/lib/normalize-search';
import { getErrorKey } from '@/lib/error-message';
import type { ProductSummary, ProductStatus } from '@/services/types';
import { MobileProductCard } from './mobile-product-card';
import { ProductDetailDrawer } from './product-detail-drawer';
import { Fab } from '../../inventory/_components/fab';
import { ProductsProvider, useProducts } from './products-context';

type StatusFilter = 'all' | ProductStatus;

interface Props {
  initialData: ProductSummary[];
}

export function MobileProductsClient({ initialData }: Props) {
  const [data, setData] = useState<ProductSummary[]>(initialData);

  const removeProduct = useCallback((id: number) => {
    setData((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <ProductsProvider>
      <ProductsShell data={data} onProductDeleted={removeProduct} />
    </ProductsProvider>
  );
}

function ProductsShell({ data, onProductDeleted }: { data: ProductSummary[]; onProductDeleted: (id: number) => void }) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const { state, actions } = useProducts();

  const handleDeleteConfirm = useCallback(async () => {
    const result = await actions.confirmDelete(onProductDeleted);
    if (result && !result.success) {
      toast.error(tCommon(getErrorKey(result.error)));
    } else if (result?.success) {
      toast.success(t('deleteSuccess'));
    }
  }, [actions, onProductDeleted, t, tCommon]);

  const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('statusAll') },
    { value: 'active', label: t('statusActive') },
    { value: 'out_of_stock', label: t('statusOutOfStock') },
  ];

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const matchSearch = !state.search || normalizeSearchText(p.name).includes(state.search);
      const matchStatus = state.statusFilter === 'all' || p.status === state.statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, state.search, state.statusFilter]);

  const hasFilters = state.search !== '' || state.statusFilter !== 'all';

  const handleDetailClose = useCallback((open: boolean) => { if (!open) actions.closeDetail(); }, [actions]);

  return (
    <>
      <MobileSearchBar
        value={state.inputValue}
        onChange={actions.setInputValue}
        placeholder={t('searchPlaceholder')}
        clearLabel={tCommon('clearSearch')}
      />

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

      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('countLabel', { count: filtered.length })}</p>

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
        deleteConfirmOpen={state.deleteConfirmOpen}
        isDeleting={state.isDeleting}
        onDeleteRequest={actions.openDeleteConfirm}
        onDeleteConfirm={handleDeleteConfirm}
        onDeleteCancel={actions.closeDeleteConfirm}
      />
    </>
  );
}
