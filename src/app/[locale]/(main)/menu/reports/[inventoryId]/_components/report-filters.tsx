'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';

export function ReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('reports');

  const dateFrom = searchParams.get('from') ?? '';
  const dateTo = searchParams.get('to') ?? '';
  const today = new Date().toISOString().slice(0, 10);

  const update = useCallback((key: string, value: string, other: string, otherKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (value && other) {
      if (key === 'from' && value > other) params.set(otherKey, value);
      if (key === 'to' && value < other) params.set(otherKey, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const isInvalid = dateFrom && dateTo && dateFrom > dateTo;

  return (
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
  );
}
