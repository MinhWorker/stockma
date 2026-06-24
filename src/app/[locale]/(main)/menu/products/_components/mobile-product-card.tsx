'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { ProductSummary } from '@/services/types';
import { formatPrice } from '@/lib/utils';
import { ProductAvatar } from '@/components/data-display/product-avatar';

interface Props {
  product: ProductSummary;
  onClick: () => void;
}

export function MobileProductCard({ product: p, onClick }: Props) {
  const t = useTranslations('products');
  const isOutOfStock = p.status === 'out_of_stock';

  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => (e.currentTarget as HTMLElement).blur()}
      className="flex w-full items-center gap-3 px-4 py-3.5 bg-card text-left active:bg-muted/60 transition-colors"
    >
      <ProductAvatar name={p.name} imageUrl={p.imageUrl} categoryName={p.categoryName} />

      {/* Name + category */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{p.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">{p.categoryName}</p>
      </div>

      {/* Price + stock */}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {p.variants.length === 0 && (
          <span className="text-sm font-semibold tabular-nums">{formatPrice(p.price)}</span>
        )}
        <span className={cn(
          'text-[10px] tabular-nums font-medium',
          isOutOfStock ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {t('stockLabel', { qty: p.stockQty })}
        </span>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 ml-0.5" />
    </button>
  );
}
