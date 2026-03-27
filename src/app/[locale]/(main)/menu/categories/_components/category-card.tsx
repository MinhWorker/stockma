import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/services/types';

interface Props {
  category: CategorySummary;
  onClick: () => void;
}

export function CategoryCard({ category: c, onClick }: Props) {
  const isActive = c.state === 'active';
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 bg-card text-left active:bg-muted transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
        {c.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{c.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-slate-400')}
          />
          <span className="text-xs text-muted-foreground">{c.state}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold tabular-nums">{c.totalProducts}</span>
        <span className="text-[10px] text-muted-foreground">sản phẩm</span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </button>
  );
}
