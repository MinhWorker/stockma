'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X, Check, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn, formatPrice } from '@/lib/utils';
import type { ProductSummary } from '@/services/types';
import { useOrder, makeKey } from '../_context/order-context';
import { OrderReviewDrawer } from '@/app/[locale]/(main)/menu/order/_components/order-review-drawer';

interface Props {
  products: ProductSummary[];
}

export function OrderCatalog({ products }: Props) {
  const t = useTranslations('order');
  const { state, actions } = useOrder();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.categoryName));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q);
      const matchCat = categoryFilter === 'all' || p.categoryName === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  function toggleExpand(productId: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  // Count selected items
  const selectedCount = state.items.length;

  return (
    <>
      {/* Search */}
      <div className="relative px-4 py-2">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-9 pr-9 bg-muted border-0 rounded-xl h-10"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
        <button
          onClick={() => setCategoryFilter('all')}
          className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
            categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
        >
          {t('allCategories')}
        </button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              categoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('countLabel', { count: filtered.length })}</p>

      {/* Product list */}
      <div className="divide-y divide-border pb-28">
        {filtered.map((p) => {
          const hasVariants = p.variants.length > 0;
          const isExpanded = expandedIds.has(p.id);
          const productKey = makeKey(p.id);

          // For variant products: count how many variants are selected
          const selectedVariantCount = hasVariants
            ? p.variants.filter((v) => actions.isSelected(makeKey(p.id, v.id))).length
            : 0;
          const productSelected = hasVariants
            ? selectedVariantCount > 0
            : actions.isSelected(productKey);

          return (
            <div key={p.id}>
              {/* Product row */}
              <button
                onClick={() => {
                  if (hasVariants) toggleExpand(p.id);
                  else actions.toggleProduct(p);
                }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                  productSelected ? 'bg-primary/5' : 'bg-card active:bg-muted'
                )}
              >
                {/* Selection indicator */}
                <div className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  productSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                )}>
                  {productSelected && (
                    hasVariants
                      ? <span className="text-[10px] font-bold text-primary-foreground">{selectedVariantCount}</span>
                      : <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                  )}
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
                  {p.categoryName.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.categoryName}
                    {hasVariants && (
                      <span className="ml-1.5 text-[10px] bg-muted rounded px-1 py-0.5">
                        {p.variants.length} phân loại
                      </span>
                    )}
                  </p>
                </div>

                <div className="shrink-0 text-right flex items-center gap-1.5">
                  {!hasVariants && (
                    <div>
                      <p className="text-sm font-semibold tabular-nums">{formatPrice(p.price)}</p>
                      <p className={cn('text-[10px]', p.stockQty === 0 ? 'text-rose-500' : 'text-muted-foreground')}>
                        {t('stock', { qty: p.stockQty })}
                      </p>
                    </div>
                  )}
                  {hasVariants && (
                    isExpanded
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Variant rows — shown when expanded */}
              {hasVariants && isExpanded && (
                <div className="bg-muted/30 divide-y divide-border/50">
                  {p.variants.map((v) => {
                    const vKey = makeKey(p.id, v.id);
                    const vSelected = actions.isSelected(vKey);
                    return (
                      <button
                        key={v.id}
                        onClick={() => actions.toggleVariant(p, v)}
                        className={cn(
                          'flex w-full items-center gap-3 pl-14 pr-4 py-2.5 text-left transition-colors',
                          vSelected ? 'bg-primary/8' : 'active:bg-muted'
                        )}
                      >
                        <div className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                          vSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                        )}>
                          {vSelected && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{v.name}</p>
                          {v.effectiveUnit && (
                            <p className="text-xs text-muted-foreground">{v.effectiveUnit}</p>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums">{formatPrice(v.effectivePrice)}</p>
                          <p className={cn('text-[10px]', v.stockQty === 0 ? 'text-rose-500' : 'text-muted-foreground')}>
                            {t('stock', { qty: v.stockQty })}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky summary bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30">
          <button
            onClick={actions.openReview}
            className="w-full flex items-center justify-between gap-3 bg-primary text-primary-foreground rounded-2xl px-5 py-3.5 shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-semibold">{t('reviewBtn', { count: selectedCount })}</span>
            </div>
            <span className="text-xs bg-primary-foreground/20 rounded-full px-2.5 py-0.5 font-medium">
              {t('selectedCount', { count: selectedCount })}
            </span>
          </button>
        </div>
      )}

      <OrderReviewDrawer />
    </>
  );
}
