import { ChevronRight } from 'lucide-react';
import type { ProviderSummary } from '@/services/types';

interface Props {
  provider: ProviderSummary;
  onClick: () => void;
}

export function ProviderCard({ provider: p, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 bg-card text-left active:bg-muted transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
        {p.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{p.name}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold tabular-nums">{p.totalProducts}</span>
        <span className="text-[10px] text-muted-foreground">sản phẩm</span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </button>
  );
}
