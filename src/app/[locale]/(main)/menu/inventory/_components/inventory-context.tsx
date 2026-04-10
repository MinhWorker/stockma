'use client';

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedUrlParam } from '@/hooks/use-debounced-url-param';
import { useRouter, usePathname } from '@/i18n/routing';
import { normalizeSearchText } from '@/lib/normalize-search';
import type { TransactionRecord, TransactionType } from '@/services/types';

interface InventoryState {
  inputValue: string;
  search: string;
  tab: 'all' | TransactionType;
  selectedTx: TransactionRecord | null;
  detailOpen: boolean;
}

interface InventoryActions {
  setInputValue: (v: string) => void;
  setTab: (v: 'all' | TransactionType) => void;
  openDetail: (tx: TransactionRecord) => void;
  closeDetail: () => void;
}

interface InventoryContextValue {
  state: InventoryState;
  actions: InventoryActions;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function useInventory() {
  const ctx = use(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [inputValue, setInputValue, search] = useDebouncedUrlParam(
    'q',
    300,
    normalizeSearchText
  );
  const tab = (searchParams.get('tab') ?? 'all') as 'all' | TransactionType;

  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const setTab = useCallback((v: string) => {
    const params = new URLSearchParams(window.location.search);
    if (v === 'all') params.delete('tab');
    else params.set('tab', v);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}` as Parameters<typeof router.replace>[0], { scroll: false });
  }, [router, pathname]);

  const openDetail = useCallback((tx: TransactionRecord) => {
    setSelectedTx(tx);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => setDetailOpen(false), []);

  const contextValue = useMemo<InventoryContextValue>(() => ({
    state: { inputValue, search, tab, selectedTx, detailOpen },
    actions: { setInputValue, setTab, openDetail, closeDetail },
  }), [inputValue, search, tab, selectedTx, detailOpen,
      setInputValue, setTab, openDetail, closeDetail]);

  return (
    <InventoryContext value={contextValue}>
      {children}
    </InventoryContext>
  );
}
