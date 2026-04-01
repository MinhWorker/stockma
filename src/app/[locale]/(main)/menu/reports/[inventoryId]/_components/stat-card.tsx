import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red' | 'blue' | 'default';
}

const ACCENT = {
  green: 'text-emerald-600 dark:text-emerald-400',
  red: 'text-rose-600 dark:text-rose-400',
  blue: 'text-sky-600 dark:text-sky-400',
  default: '',
};

export function StatCard({ label, value, sub, accent = 'default' }: Props) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-bold tabular-nums leading-tight', ACCENT[accent])}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
