'use client';

import { useMemo, useState } from 'react';
import { Search, X, Check, PackagePlus, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn, formatPrice } from '@/lib/utils';
import type { ProductSummary } from '@/services/types';
import {
  makeBulkStockInKey,
  useBulkStockIn,
} from '../_context/bulk-stock-in-context';
import { BulkStockInReviewDrawer } from './bulk-stock-in-review-drawer';

interface Props {
  products: ProductSummary[];
}

export function BulkStockInCatalog({ products }: Props) {
  const { state, actions } = useBulkStockIn();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const categories = useMemo(() => {
    const set = new Set(products.map((product) => product.categoryName));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((product) => {
      const matchSearch = !q || product.name.toLowerCase().includes(q);
      const matchCategory = categoryFilter === 'all' || product.categoryName === categoryFilter;
      return matchSearch && matchCategory;
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

  const selectedCount = state.items.length;

  return (
    <>
      <div className="relative px-4 py-2">
        <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm sản phẩm cần nhập..."
          className="h-10 rounded-xl border-0 bg-muted pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
            categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          Tất cả
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategoryFilter(category)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              categoryFilter === category ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <p className="px-4 pb-1 text-xs text-muted-foreground">{filtered.length} sản phẩm</p>

      <div className="divide-y divide-border pb-28">
        {filtered.map((product) => {
          const hasVariants = product.variants.length > 0;
          const isExpanded = expandedIds.has(product.id);
          const productKey = makeBulkStockInKey(product.id);
          const selectedVariantCount = hasVariants
            ? product.variants.filter((variant) => actions.isSelected(makeBulkStockInKey(product.id, variant.id))).length
            : 0;
          const productSelected = hasVariants
            ? selectedVariantCount > 0
            : actions.isSelected(productKey);

          return (
            <div key={product.id}>
              <button
                type="button"
                onClick={() => {
                  if (hasVariants) toggleExpand(product.id);
                  else actions.toggleProduct(product);
                }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                  productSelected ? 'bg-primary/5' : 'bg-card active:bg-muted'
                )}
              >
                <div className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  productSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                )}>
                  {productSelected && (
                    hasVariants
                      ? <span className="text-[10px] font-bold text-primary-foreground">{selectedVariantCount}</span>
                      : <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                  )}
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
                  {product.categoryName.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">{product.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {product.categoryName}
                    {hasVariants && (
                      <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px]">
                        {product.variants.length} phân loại
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 text-right">
                  {!hasVariants && (
                    <div>
                      <p className="text-sm font-semibold tabular-nums">{formatPrice(product.costPrice)}</p>
                      <p className="text-[10px] text-muted-foreground">Tồn: {product.stockQty}</p>
                    </div>
                  )}
                  {hasVariants && (
                    isExpanded
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {hasVariants && isExpanded && (
                <div className="divide-y divide-border/50 bg-muted/30">
                  {product.variants.map((variant) => {
                    const variantKey = makeBulkStockInKey(product.id, variant.id);
                    const variantSelected = actions.isSelected(variantKey);
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => actions.toggleVariant(product, variant)}
                        className={cn(
                          'flex w-full items-center gap-3 py-2.5 pl-14 pr-4 text-left transition-colors',
                          variantSelected ? 'bg-primary/8' : 'active:bg-muted'
                        )}
                      >
                        <div className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                          variantSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                        )}>
                          {variantSelected && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{variant.name}</p>
                          {variant.effectiveUnit && (
                            <p className="text-xs text-muted-foreground">{variant.effectiveUnit}</p>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums">{formatPrice(variant.effectiveCostPrice)}</p>
                          <p className="text-[10px] text-muted-foreground">Tồn: {variant.stockQty}</p>
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

      {selectedCount > 0 && (
        <div className="fixed bottom-20 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4">
          <button
            type="button"
            onClick={actions.openReview}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5" />
              <span className="text-sm font-semibold">Xem danh sách nhập ({selectedCount})</span>
            </div>
            <span className="rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-xs font-medium">
              Đã chọn {selectedCount}
            </span>
          </button>
        </div>
      )}

      <BulkStockInReviewDrawer />
    </>
  );
}
