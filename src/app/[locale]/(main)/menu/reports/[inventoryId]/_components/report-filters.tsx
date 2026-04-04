'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { SyncBackParams } from './sync-back-params';
import { useQueryParams } from '@/hooks/use-query-params';

export function ReportFilters() {
  const { get, replace } = useQueryParams();
  const t = useTranslations('reports');

  const dateFrom = get('from') ?? '';
  const dateTo = get('to') ?? '';
  const today = new Date().toISOString().slice(0, 10);

  const update = useCallback((key: 'from' | 'to', value: string, other: string, otherKey: 'from' | 'to') => {
    const updates: Record<string, string | null> = { [key]: value || null };
    if (value && other) {
      if (key === 'from' && value > other) updates[otherKey] = value;
      if (key === 'to' && value < other) updates[otherKey] = value;
    }
    replace(updates);
  }, [replace]);

  const isInvalid = dateFrom && dateTo && dateFrom > dateTo;

  return (
    <>
      <SyncBackParams />
      <div className="px-4 py-2 space-y-1.5">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('dateFrom')}</p>
            <Input type="date" value={dateFrom} max={dateTo || today} onChange={(e) => update('from', e.target.value, dateTo, 'to')} className="h-8 text-xs" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('dateTo')}</p>
            <Input type="date" value={dateTo} min={dateFrom || undefined} max={today} onChange={(e) => update('to', e.target.value, dateFrom, 'from')} className="h-8 text-xs" />
          </div>
        </div>
        {isInvalid && <p className="text-xs text-destructive">{t('dateRangeError')}</p>}
      </div>
    </>
  );
}
