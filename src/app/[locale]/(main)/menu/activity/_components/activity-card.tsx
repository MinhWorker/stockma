'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatRelativeDate } from '@/lib/utils';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import type { ActivityLogRecord, ActivityAction } from '@/services/types';

const ACTION_STYLE: Record<ActivityAction, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  create: { icon: Plus, iconBg: 'bg-emerald-100 dark:bg-emerald-950', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  update: { icon: Pencil, iconBg: 'bg-blue-100 dark:bg-blue-950', iconColor: 'text-blue-600 dark:text-blue-400' },
  delete: { icon: Trash2, iconBg: 'bg-rose-100 dark:bg-rose-950', iconColor: 'text-rose-600 dark:text-rose-400' },
  export: { icon: Download, iconBg: 'bg-amber-100 dark:bg-amber-950', iconColor: 'text-amber-600 dark:text-amber-400' },
};

interface Props {
  log: ActivityLogRecord;
}

export function ActivityCard({ log }: Props) {
  const t = useTranslations('activity');
  const style = ACTION_STYLE[log.action];
  const Icon = style.icon;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', style.iconBg)}>
        <Icon className={cn('h-4 w-4', style.iconColor)} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{log.description}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {log.userName ?? t('system')}
          {log.entityType ? ` · ${log.entityType}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] text-muted-foreground">{formatRelativeDate(log.createdAt)}</p>
        <p className={cn('text-xs font-medium mt-0.5', style.iconColor)}>{t(`actions.${log.action}`)}</p>
      </div>
    </div>
  );
}
