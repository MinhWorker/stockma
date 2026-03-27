import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TrendProps {
  value: number;
  label?: string;
}

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  trend?: TrendProps;
  isLoading?: boolean;
}

export function StatCard({ icon: Icon, title, value, trend, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-8 rounded-md" />
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  const isPositive = trend && trend.value >= 0;

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-md bg-muted p-2">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {trend && (
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-xs',
            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          <span>
            {isPositive ? '+' : ''}
            {trend.value}%{trend.label ? ` ${trend.label}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
