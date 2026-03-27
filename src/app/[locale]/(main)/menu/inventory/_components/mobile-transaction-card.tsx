import { cn } from '@/lib/utils';
import type { TransactionRecord } from '@/services/types';
import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from 'lucide-react';

const TYPE_CONFIG = {
  stock_in: {
    icon: ArrowDownToLine,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    qtyColor: 'text-emerald-600 dark:text-emerald-400',
    sign: '+',
  },
  stock_out: {
    icon: ArrowUpFromLine,
    iconBg: 'bg-rose-100 dark:bg-rose-950',
    iconColor: 'text-rose-600 dark:text-rose-400',
    qtyColor: 'text-rose-600 dark:text-rose-400',
    sign: '',
  },
  adjustment: {
    icon: SlidersHorizontal,
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    qtyColor: 'text-blue-600 dark:text-blue-400',
    sign: '',
  },
} as const;

function formatDate(d: Date) {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

interface Props {
  transaction: TransactionRecord;
  onClick: () => void;
}

export function MobileTransactionCard({ transaction: tx, onClick }: Props) {
  const cfg = TYPE_CONFIG[tx.type];
  const Icon = cfg.icon;
  const qty = tx.quantity > 0 ? `+${tx.quantity}` : String(tx.quantity);

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 bg-card text-left active:bg-muted transition-colors"
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          cfg.iconBg
        )}
      >
        <Icon className={cn('h-4 w-4', cfg.iconColor)} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{tx.productName}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{tx.note ? tx.note : ''}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className={cn('text-sm font-semibold tabular-nums', cfg.qtyColor)}>{qty}</span>
        <span className="text-[10px] text-muted-foreground">{formatDate(tx.createdAt)}</span>
      </div>
    </button>
  );
}
