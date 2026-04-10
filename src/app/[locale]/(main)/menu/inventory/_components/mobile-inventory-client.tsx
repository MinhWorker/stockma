'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MobileSearchBar } from '@/components/forms/mobile-search-bar';
import { normalizeSearchText } from '@/lib/normalize-search';
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
  const tCommon = useTranslations('common');
  const { state, actions } = useInventory();

  const filtered = useMemo(() => {
    return initialData.filter((tx) => {
      const matchTab = state.tab === 'all' || tx.type === state.tab;
      const matchSearch = !state.search || normalizeSearchText(tx.productName).includes(state.search);
      return matchTab && matchSearch;
    });
  }, [initialData, state.search, state.tab]);

  return (
    <>
      <MobileSearchBar
        value={state.inputValue}
        onChange={actions.setInputValue}
        placeholder={t('searchPlaceholder')}
        clearLabel={tCommon('clearSearch')}
      />

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
