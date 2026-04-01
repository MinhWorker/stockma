'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { TransactionType } from '@/types/transaction';

type TabValue = 'all' | TransactionType;

interface Props {
  active: TabValue;
  onChange: (v: TabValue) => void;
}

export function MobileFilterBar({ active, onChange }: Props) {
  const t = useTranslations('inventory.tabs');

  const TABS: { value: TabValue; label: string }[] = [
    { value: 'all', label: t('all') },
    { value: 'stock_in', label: t('stockIn') },
    { value: 'stock_out', label: t('stockOut') },
    { value: 'adjustment', label: t('adjustments') },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
            active === tab.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
