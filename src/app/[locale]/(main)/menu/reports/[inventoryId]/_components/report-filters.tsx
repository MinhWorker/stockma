'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DatePicker } from '@/components/ui/date-picker';
import { SyncBackParams } from './sync-back-params';
import { useQueryParams } from '@/hooks/use-query-params';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function toISO(d: Date) { return d.toISOString().slice(0, 10); }

function getPresetRange(preset: string): { from: string; to: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toISO(today);

  if (preset === 'today') {
    return { from: todayStr, to: todayStr };
  }
  if (preset === '7days') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: toISO(from), to: todayStr };
  }
  if (preset === 'thisMonth') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toISO(from), to: todayStr };
  }
  if (preset === 'lastMonth') {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: toISO(from), to: toISO(to) };
  }
  return null; // 'custom'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ReportFilters() {
  const { get, replace } = useQueryParams();
  const t = useTranslations('reports');

  const dateFrom = get('from') ?? '';
  const dateTo = get('to') ?? '';
  const today = toISO(new Date());

  // Detect which preset is currently active (if any)
  const activePreset = useMemo(() => {
    const presets = ['today', '7days', 'thisMonth', 'lastMonth'];
    for (const p of presets) {
      const range = getPresetRange(p);
      if (range && range.from === dateFrom && range.to === dateTo) return p;
    }
    return dateFrom || dateTo ? 'custom' : null;
  }, [dateFrom, dateTo]);

  const [showCustom, setShowCustom] = useState(activePreset === 'custom');

  const PRESETS = [
    { id: 'today',     label: t('presetToday')     },
    { id: '7days',     label: t('preset7Days')      },
    { id: 'thisMonth', label: t('presetThisMonth')  },
    { id: 'lastMonth', label: t('presetLastMonth')  },
    { id: 'custom',    label: t('presetCustom')     },
  ];

  function applyPreset(id: string) {
    if (id === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const range = getPresetRange(id);
    if (range) replace({ from: range.from, to: range.to });
  }

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
      <div className="px-4 py-2 space-y-2">
        {/* Quick preset chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {PRESETS.map((p) => {
            const isActive = p.id === 'custom' ? showCustom : activePreset === p.id && !showCustom;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom date pickers — only shown when "Custom" is selected */}
        {showCustom && (
          <div className="space-y-1">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('dateFrom')}</p>
                <DatePicker
                  value={dateFrom}
                  max={dateTo || today}
                  onChange={(v) => update('from', v, dateTo, 'to')}
                />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('dateTo')}</p>
                <DatePicker
                  value={dateTo}
                  min={dateFrom || undefined}
                  max={today}
                  onChange={(v) => update('to', v, dateFrom, 'from')}
                />
              </div>
            </div>
            {isInvalid && <p className="text-xs text-destructive">{t('dateRangeError')}</p>}
          </div>
        )}
      </div>
    </>
  );
}
