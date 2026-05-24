'use client';

import { createContext, use, useCallback, useState, type ReactNode } from 'react';
import type { ProductSummary, VariantSummary } from '@/services/types';

export interface BulkStockInItem {
  key: string;
  product: ProductSummary;
  variant: VariantSummary | null;
  quantity: number;
  purchasePrice: string;
}

interface BulkStockInState {
  items: BulkStockInItem[];
  note: string;
  reviewOpen: boolean;
}

interface BulkStockInActions {
  toggleProduct: (product: ProductSummary) => void;
  toggleVariant: (product: ProductSummary, variant: VariantSummary) => void;
  isSelected: (key: string) => boolean;
  setQty: (key: string, qty: number) => void;
  setPurchasePrice: (key: string, price: string) => void;
  removeItem: (key: string) => void;
  setNote: (note: string) => void;
  openReview: () => void;
  closeReview: () => void;
  reset: () => void;
}

interface BulkStockInContextValue {
  state: BulkStockInState;
  actions: BulkStockInActions;
}

const BulkStockInContext = createContext<BulkStockInContextValue | null>(null);

export function useBulkStockIn() {
  const ctx = use(BulkStockInContext);
  if (!ctx) throw new Error('useBulkStockIn must be used within BulkStockInProvider');
  return ctx;
}

export function makeBulkStockInKey(productId: number, variantId?: number) {
  return variantId != null ? `${productId}:${variantId}` : String(productId);
}

export function BulkStockInProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BulkStockInItem[]>([]);
  const [note, setNote] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);

  const toggleProduct = useCallback((product: ProductSummary) => {
    const key = makeBulkStockInKey(product.id);
    setItems((prev) => (
      prev.some((item) => item.key === key)
        ? prev.filter((item) => item.key !== key)
        : [...prev, { key, product, variant: null, quantity: 1, purchasePrice: '' }]
    ));
  }, []);

  const toggleVariant = useCallback((product: ProductSummary, variant: VariantSummary) => {
    const key = makeBulkStockInKey(product.id, variant.id);
    setItems((prev) => (
      prev.some((item) => item.key === key)
        ? prev.filter((item) => item.key !== key)
        : [...prev, { key, product, variant, quantity: 1, purchasePrice: '' }]
    ));
  }, []);

  const isSelected = useCallback((key: string) => items.some((item) => item.key === key), [items]);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((item) => (
      item.key === key ? { ...item, quantity: Math.max(1, qty) } : item
    )));
  }, []);

  const setPurchasePrice = useCallback((key: string, price: string) => {
    setItems((prev) => prev.map((item) => (
      item.key === key ? { ...item, purchasePrice: price } : item
    )));
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setNote('');
    setReviewOpen(false);
  }, []);

  return (
    <BulkStockInContext
      value={{
        state: { items, note, reviewOpen },
        actions: {
          toggleProduct,
          toggleVariant,
          isSelected,
          setQty,
          setPurchasePrice,
          removeItem,
          setNote,
          openReview: () => setReviewOpen(true),
          closeReview: () => setReviewOpen(false),
          reset,
        },
      }}
    >
      {children}
    </BulkStockInContext>
  );
}
