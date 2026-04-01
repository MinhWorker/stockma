'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { ProductSummary } from '@/services/types';
import { formatPrice } from '@/lib/utils';

const STATUS_DOT = {
  active: 'bg-emerald-500',
  out_of_stock: 'bg-rose-500',
} as const;

interface Props {
  product: ProductSummary;
  onClick: () => void;
}

export function MobileProductCard({ product: p, onClick }: Props) {
  const t = useTranslations('products');
  const dot = STATUS_DOT[p.status];
  const statusLabel = p.status === 'active' ? t('statusActive') : t('statusOutOfStock');

  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => (e.currentTarget as HTMLElement).blur()}
      className="flex w-full items-center gap-3 px-4 py-3 bg-card text-left active:bg-muted transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
        {p.categoryName.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{p.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dot)} />
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold tabular-nums">{formatPrice(p.price)}</span>
        <span className="text-[10px] text-muted-foreground">{t('stockLabel', { qty: p.stockQty })}</span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </button>
  );
}
