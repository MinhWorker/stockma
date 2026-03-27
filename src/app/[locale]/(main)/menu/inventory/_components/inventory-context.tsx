'use client';

import { createContext, use, useCallback, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedUrlParam } from '@/hooks/use-debounced-url-param';
import { useRouter, usePathname } from '@/i18n/routing';
import type { TransactionRecord, TransactionType } from '@/services/types';

interface InventoryState {
  inputValue: string; // controlled input — updates instantly
  search: string; // debounced URL value — used for filtering
  tab: 'all' | TransactionType;
  selectedTx: TransactionRecord | null;
  detailOpen: boolean;
  formOpen: boolean;
}

interface InventoryActions {
  setInputValue: (v: string) => void;
  setTab: (v: 'all' | TransactionType) => void;
  openDetail: (tx: TransactionRecord) => void;
  closeDetail: () => void;
  openForm: () => void;
  closeForm: () => void;
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

interface Props {
  children: ReactNode;
}

export function InventoryProvider({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [inputValue, setInputValue, search] = useDebouncedUrlParam('q');
  const tab = (searchParams.get('tab') ?? 'all') as 'all' | TransactionType;

  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const setTab = useCallback(
    (v: string) => {
      const params = new URLSearchParams(window.location.search);
      if (v === 'all') params.delete('tab');
      else params.set('tab', v);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}` as Parameters<typeof router.replace>[0], {
        scroll: false,
      });
    },
    [router, pathname]
  );

  const openDetail = useCallback((tx: TransactionRecord) => {
    setSelectedTx(tx);
    setDetailOpen(true);
  }, []);
  const closeDetail = useCallback(() => setDetailOpen(false), []);
  const openForm = useCallback(() => setFormOpen(true), []);
  const closeForm = useCallback(() => setFormOpen(false), []);

  return (
    <InventoryContext
      value={{
        state: { inputValue, search, tab, selectedTx, detailOpen, formOpen },
        actions: { setInputValue, setTab, openDetail, closeDetail, openForm, closeForm },
      }}
    >
      {children}
    </InventoryContext>
  );
}
