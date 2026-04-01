'use client';

import { useMemo, useState } from 'react';
import { Search, X, History } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import type { ActivityLogRecord, ActivityAction } from '@/services/types';
import { ActivityCard } from './activity-card';

type ActionFilter = 'all' | ActivityAction;

export function ActivityClient({ initialData }: { initialData: ActivityLogRecord[] }) {
  const t = useTranslations('activity');
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');

  const ACTION_TABS: { value: ActionFilter; label: string }[] = [
    { value: 'all', label: t('tabs.all') },
    { value: 'create', label: t('tabs.create') },
    { value: 'update', label: t('tabs.update') },
    { value: 'delete', label: t('tabs.delete') },
    { value: 'export', label: t('tabs.export') },
  ];

  function handleInput(value: string) {
    setInputValue(value);
    setSearch(value.trim().toLowerCase());
  }

  const filtered = useMemo(() => {
    return initialData.filter((log) => {
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      const matchSearch = !search || log.description.toLowerCase().includes(search) || (log.entityName?.toLowerCase().includes(search) ?? false) || (log.userName?.toLowerCase().includes(search) ?? false);
      return matchAction && matchSearch;
    });
  }, [initialData, search, actionFilter]);

  return (
    <>
      <div className="relative px-4 py-2">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={inputValue} onChange={(e) => handleInput(e.target.value)} placeholder={t('searchPlaceholder')} className="pl-9 pr-9 bg-muted border-0 rounded-xl h-10" />
        {inputValue && (
          <button onClick={() => handleInput('')} className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={t('clearSearch')}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
        {ACTION_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActionFilter(tab.value)}
            className={'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ' + (actionFilter === tab.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('countLabel', { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <History className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{t('emptyTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('emptyDesc')}</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((log) => <ActivityCard key={log.id} log={log} />)}
        </div>
      )}
    </>
  );
}
