import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { ProductSummary } from '@/services/types';

const STATUS_CONFIG = {
  active: { dot: 'bg-emerald-500', label: 'Còn hàng' },
  low_stock: { dot: 'bg-amber-500', label: 'Sắp hết' },
  out_of_stock: { dot: 'bg-rose-500', label: 'Hết hàng' },
} as const;

function formatPrice(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

interface Props {
  product: ProductSummary;
  onClick: () => void;
}

export function MobileProductCard({ product: p, onClick }: Props) {
  const cfg = STATUS_CONFIG[p.status];

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 bg-card text-left active:bg-muted transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
        {p.categoryName.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{p.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className={cn('inline-block h-1.5 w-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold tabular-nums">{formatPrice(p.price)}</span>
        <span className="text-[10px] text-muted-foreground">Tồn: {p.stockQty}</span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </button>
  );
}
