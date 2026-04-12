'use client';

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedUrlParam } from '@/hooks/use-debounced-url-param';
import { useRouter, usePathname } from '@/i18n/routing';
import { normalizeSearchText } from '@/lib/normalize-search';
import type { ProductSummary, ProductStatus } from '@/services/types';
import { deleteProductAction } from '@/actions/products.action';

type StatusFilter = 'all' | ProductStatus;

interface ProductsState {
  inputValue: string;
  search: string;
  statusFilter: StatusFilter;
  selectedProduct: ProductSummary | null;
  detailOpen: boolean;
  deleteConfirmOpen: boolean;
  isDeleting: boolean;
}

interface ProductsActions {
  setInputValue: (v: string) => void;
  setStatusFilter: (v: StatusFilter) => void;
  clearFilters: () => void;
  openDetail: (p: ProductSummary) => void;
  closeDetail: () => void;
  openAdd: () => void;
  openEdit: (p: ProductSummary) => void;
  openDeleteConfirm: () => void;
  closeDeleteConfirm: () => void;
  confirmDelete: (onSuccess: (id: number) => void) => Promise<{ success: boolean; error?: string } | undefined>;
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
}

export function ProductsProvider({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [inputValue, setInputValue, search] = useDebouncedUrlParam(
    'q',
    300,
    normalizeSearchText
  );
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilter;

  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const setStatusFilter = useCallback(
    (v: string) => {
      const params = new URLSearchParams(window.location.search);
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
    router.push('/menu/products/new' as Parameters<typeof router.push>[0]);
  }, [router]);
  const openEdit = useCallback((p: ProductSummary) => {
    router.push(`/menu/products/${p.id}/edit` as Parameters<typeof router.push>[0]);
  }, [router]);

  const openDeleteConfirm = useCallback(() => setDeleteConfirmOpen(true), []);
  const closeDeleteConfirm = useCallback(() => setDeleteConfirmOpen(false), []);
  const confirmDelete = useCallback(async (onSuccess: (id: number) => void) => {
    if (!selectedProduct) return;
    setIsDeleting(true);
    try {
      const result = await deleteProductAction(selectedProduct.id);
      if (result.success) {
        onSuccess(selectedProduct.id);
        setDeleteConfirmOpen(false);
        setDetailOpen(false);
      }
      return result;
    } finally {
      setIsDeleting(false);
    }
  }, [selectedProduct]);

  const contextValue = useMemo<ProductsContextValue>(() => ({
    state: {
      inputValue,
      search,
      statusFilter,
      selectedProduct,
      detailOpen,
      deleteConfirmOpen,
      isDeleting,
    },
    actions: {
      setInputValue,
      setStatusFilter,
      clearFilters,
      openDetail,
      closeDetail,
      openAdd,
      openEdit,
      openDeleteConfirm,
      closeDeleteConfirm,
      confirmDelete,
    },
  }), [inputValue, search, statusFilter, selectedProduct, detailOpen, deleteConfirmOpen, isDeleting,
      setInputValue, setStatusFilter, clearFilters, openDetail, closeDetail, openAdd, openEdit,
      openDeleteConfirm, closeDeleteConfirm, confirmDelete]);

  return (
    <ProductsContext value={contextValue}>
      {children}
    </ProductsContext>
  );
}
