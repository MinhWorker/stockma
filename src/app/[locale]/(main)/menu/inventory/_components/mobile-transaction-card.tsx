import { cn } from '@/lib/utils';
import { formatRelativeDate, formatPrice } from '@/lib/utils';
import type { TransactionRecord } from '@/services/types';
import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, Gift } from 'lucide-react';

const TYPE_CONFIG = {
  stock_in: {
    icon: ArrowDownToLine,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    qtyColor: 'text-emerald-600 dark:text-emerald-400',
  },
  stock_out: {
    icon: ArrowUpFromLine,
    iconBg: 'bg-rose-100 dark:bg-rose-950',
    iconColor: 'text-rose-600 dark:text-rose-400',
    qtyColor: 'text-rose-600 dark:text-rose-400',
  },
  adjustment: {
    icon: SlidersHorizontal,
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    qtyColor: 'text-blue-600 dark:text-blue-400',
  },
} as const;

interface Props {
  transaction: TransactionRecord;
  onClick: () => void;
}

export function MobileTransactionCard({ transaction: tx, onClick }: Props) {
  const cfg = TYPE_CONFIG[tx.type];
  const Icon = cfg.icon;
  const qty = tx.quantity > 0 ? `+${tx.quantity}` : String(tx.quantity);

  // Second line: variant > note > empty
  const subtitle = tx.variantName ?? tx.note ?? null;

  // Price to show inline (salePrice for stock_out, purchasePrice for stock_in)
  const inlinePrice = tx.salePrice ?? tx.purchasePrice ?? null;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 bg-card text-left active:bg-muted transition-colors"
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', cfg.iconBg)}>
        {tx.isGift
          ? <Gift className={cn('h-4 w-4', cfg.iconColor)} strokeWidth={2} />
          : <Icon className={cn('h-4 w-4', cfg.iconColor)} strokeWidth={2} />
        }
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{tx.productName}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{formatRelativeDate(tx.createdAt)}</span>
          {subtitle && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="truncate">{subtitle}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className={cn('text-sm font-semibold tabular-nums', cfg.qtyColor)}>{qty}</span>
        {inlinePrice != null && (
          <span className="text-[10px] text-muted-foreground">{formatPrice(inlinePrice)}</span>
        )}
      </div>
    </button>
  );
}
