'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/routing';
import { ProductAvatar } from '@/components/data-display/product-avatar';
import { cn, formatPrice } from '@/lib/utils';
import type { ProductSummary } from '@/services/types';

interface ProductPickerPanelProps {
  products: ProductSummary[];
  productId: number;
  productSearch: string;
  onProductChange: (id: number) => void;
  onSearchChange: (search: string) => void;
  error?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  addNewHref?: string;
}

export function ProductPickerPanel({
  products,
  productId,
  productSearch,
  onProductChange,
  onSearchChange,
  error,
  isLoading,
  placeholder = 'Chọn sản phẩm',
  addNewHref,
}: ProductPickerPanelProps) {
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const selectedProduct = products.find((product) => product.id === productId);

  const categories = useMemo(() => {
    const set = new Set(products.map((product) => product.categoryName));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || product.name.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === 'all' || product.categoryName === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, categoryFilter]);

  function selectProduct(id: number) {
    onProductChange(id);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-3 text-left transition-colors active:bg-muted',
          error ? 'border-destructive' : 'border-input'
        )}
        aria-expanded={open}
      >
        {selectedProduct ? (
          <ProductAvatar
            name={selectedProduct.name}
            imageUrl={selectedProduct.imageUrl}
            categoryName={selectedProduct.categoryName}
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-medium', !selectedProduct && 'text-muted-foreground')}>
            {selectedProduct?.name ?? placeholder}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {selectedProduct
              ? `${selectedProduct.categoryName} - Tồn ${selectedProduct.stockQty}`
              : 'Mở danh sách sản phẩm dạng thẻ'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-primary">
          {selectedProduct ? 'Đổi' : 'Chọn'}
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="space-y-2 border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Tìm sản phẩm..."
                className="h-10 bg-muted pl-9 pr-9"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
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
                    'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    categoryFilter === category ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-80 divide-y divide-border overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Đang tải sản phẩm...</p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Không tìm thấy sản phẩm.</p>
            ) : (
              filtered.map((product) => {
                const selected = product.id === productId;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors active:bg-muted',
                      selected && 'bg-primary/5'
                    )}
                  >
                    <ProductAvatar
                      name={product.name}
                      imageUrl={product.imageUrl}
                      categoryName={product.categoryName}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {product.categoryName}
                        {product.variants.length > 0 && ` - ${product.variants.length} phân loại`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {product.variants.length === 0 && (
                        <p className="text-sm font-semibold tabular-nums">{formatPrice(product.price)}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">Tồn {product.stockQty}</p>
                    </div>
                    <div className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                      selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                    )}>
                      {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {addNewHref && (
            <div className="border-t border-border p-2">
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href={addNewHref as Parameters<typeof Link>[0]['href']}>
                  <Plus className="h-4 w-4" />
                  Thêm sản phẩm mới
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
