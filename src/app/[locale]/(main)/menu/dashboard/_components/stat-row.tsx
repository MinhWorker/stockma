import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
}

export function StatRow({ icon: Icon, label, value, color }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 bg-card">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', color)}>
        <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
}
