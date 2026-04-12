import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red' | 'blue' | 'default';
  wide?: boolean;
}

const ACCENT_VALUE = {
  green:   'text-emerald-600 dark:text-emerald-400',
  red:     'text-destructive',
  blue:    'text-sky-600 dark:text-sky-400',
  default: 'text-foreground',
};

export function StatCard({ label, value, sub, accent = 'default', wide }: Props) {
  return (
    <div className={cn(
      'rounded-xl bg-card border border-border/60 px-4 py-3.5 space-y-1',
      wide && 'col-span-2'
    )}>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      <p className={cn('text-lg font-bold tabular-nums leading-tight', ACCENT_VALUE[accent])}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>}
    </div>
  );
}
