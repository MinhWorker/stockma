'use client';

import { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import type { TransactionRecord } from '@/services/types';
import { MobileFilterBar } from './mobile-filter-bar';
import { MobileTransactionList } from './mobile-transaction-list';
import { TransactionDetailDrawer } from './transaction-detail-drawer';
import { InventoryProvider, useInventory } from './inventory-context';

interface Props {
  initialData: TransactionRecord[];
}

export function MobileInventoryClient({ initialData }: Props) {
  return (
    <InventoryProvider>
      <InventoryShell initialData={initialData} />
    </InventoryProvider>
  );
}

function InventoryShell({ initialData }: Props) {
  const t = useTranslations('inventory');
  const { state, actions } = useInventory();

  const filtered = useMemo(() => {
    const q = state.search.toLowerCase();
    return initialData.filter((tx) => {
      const matchTab = state.tab === 'all' || tx.type === state.tab;
      const matchSearch = !q || tx.productName.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [initialData, state.search, state.tab]);

  return (
    <>
      <div className="relative px-4 py-2">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={state.inputValue}
          onChange={(e) => actions.setInputValue(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-9 pr-9 bg-muted border-0 rounded-xl h-10"
        />
        {state.inputValue && (
          <button
            onClick={() => actions.setInputValue('')}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <MobileFilterBar active={state.tab} onChange={actions.setTab} />

      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('countLabel', { count: filtered.length })}</p>

      <MobileTransactionList
        transactions={filtered}
        emptyTitle={t('emptyFilterTitle')}
        emptyDesc={t('emptyFilterDesc')}
        onSelect={actions.openDetail}
      />

      <TransactionDetailDrawer
        transaction={state.selectedTx}
        open={state.detailOpen}
        onOpenChange={(open) => !open && actions.closeDetail()}
      />
    </>
  );
}
