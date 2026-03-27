import type { TransactionRecord } from '@/services/types';
import { MobileTransactionCard } from './mobile-transaction-card';
import { Warehouse } from 'lucide-react';

function groupByDate(
  transactions: TransactionRecord[]
): { label: string; items: TransactionRecord[] }[] {
  const map = new Map<string, TransactionRecord[]>();

  for (const tx of transactions) {
    const d = tx.createdAt;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);

    let label: string;
    if (diffDays === 0) label = 'Hôm nay';
    else if (diffDays === 1) label = 'Hôm qua';
    else if (diffDays < 7) label = 'Tuần này';
    else if (diffDays < 30) label = 'Tháng này';
    else label = d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  }

  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

interface Props {
  transactions: TransactionRecord[];
  emptyTitle: string;
  emptyDesc: string;
  onSelect: (tx: TransactionRecord) => void;
}

export function MobileTransactionList({ transactions, emptyTitle, emptyDesc, onSelect }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Warehouse className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <p className="font-medium">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{emptyDesc}</p>
        </div>
      </div>
    );
  }

  const groups = groupByDate(transactions);

  return (
    <div className="divide-y divide-border">
      {groups.map(({ label, items }) => (
        <div key={label}>
          <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {label}
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {items.map((tx) => (
              <MobileTransactionCard key={tx.id} transaction={tx} onClick={() => onSelect(tx)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
