'use client';

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedUrlParam } from '@/hooks/use-debounced-url-param';
import { useRouter, usePathname } from '@/i18n/routing';
import type { ProductSummary, ProductStatus } from '@/services/types';

type StatusFilter = 'all' | ProductStatus;

interface ProductsState {
  inputValue: string; // controlled input — updates instantly
  search: string; // debounced URL value — used for filtering
  statusFilter: StatusFilter;
  selectedProduct: ProductSummary | null;
  detailOpen: boolean;
  formOpen: boolean;
  editingProduct: ProductSummary | undefined;
}

interface ProductsActions {
  setInputValue: (v: string) => void;
  setStatusFilter: (v: StatusFilter) => void;
  clearFilters: () => void;
  openDetail: (p: ProductSummary) => void;
  closeDetail: () => void;
  openAdd: () => void;
  openEdit: (p: ProductSummary) => void;
  closeForm: () => void;
}

interface ProductsContextValue {
  state: ProductsState;
  actions: ProductsActions;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function useProducts() {
  const ctx = use(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}

interface Props {
  children: ReactNode;
  openAddForm?: boolean;
}

export function ProductsProvider({ children, openAddForm }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [inputValue, setInputValue, search] = useDebouncedUrlParam('q');
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilter;

  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(() => !!openAddForm);
  const [editingProduct, setEditingProduct] = useState<ProductSummary | undefined>();

  const setStatusFilter = useCallback(
    (v: string) => {
      const params = new URLSearchParams(window.location.search);
      params.delete('action');
      if (v === 'all') params.delete('status');
      else params.set('status', v);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}` as Parameters<typeof router.replace>[0], {
        scroll: false,
      });
    },
    [router, pathname]
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete('q');
    params.delete('status');
    params.delete('action');
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}` as Parameters<typeof router.replace>[0], {
      scroll: false,
    });
    setInputValue('');
  }, [router, pathname, setInputValue]);

  const openDetail = useCallback((p: ProductSummary) => {
    setSelectedProduct(p);
    setDetailOpen(true);
  }, []);
  const closeDetail = useCallback(() => setDetailOpen(false), []);
  const openAdd = useCallback(() => {
    setEditingProduct(undefined);
    setFormOpen(true);
  }, []);
  const openEdit = useCallback((p: ProductSummary) => {
    setEditingProduct(p);
    setFormOpen(true);
  }, []);
  const closeForm = useCallback(() => {
    setFormOpen(false);
    const params = new URLSearchParams(window.location.search);
    if (params.has('action')) {
      params.delete('action');
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}` as Parameters<typeof router.replace>[0], { scroll: false });
    }
  }, [router, pathname]);

  const contextValue = useMemo<ProductsContextValue>(() => ({
    state: {
      inputValue,
      search,
      statusFilter,
      selectedProduct,
      detailOpen,
      formOpen,
      editingProduct,
    },
    actions: {
      setInputValue,
      setStatusFilter,
      clearFilters,
      openDetail,
      closeDetail,
      openAdd,
      openEdit,
      closeForm,
    },
  }), [inputValue, search, statusFilter, selectedProduct, detailOpen, formOpen, editingProduct,
      setInputValue, setStatusFilter, clearFilters, openDetail, closeDetail, openAdd, openEdit, closeForm]);

  return (
    <ProductsContext value={contextValue}>
      {children}
    </ProductsContext>
  );
}
