'use client';

import { createContext, use, useCallback, useState, type ReactNode } from 'react';
import type { ProductSummary, StockOutType, VariantSummary } from '@/services/types';

export interface OrderItem {
  // key = "productId" for no-variant products, "productId:variantId" for variants
  key: string;
  product: ProductSummary;
  variant: VariantSummary | null;
  quantity: number;
  salePrice: string;
}

export interface OrderGlobalFields {
  stockOutType: StockOutType | '';
  note: string;
  debtorName: string;
  paidAmount: string;
}

interface OrderState {
  items: OrderItem[];
  global: OrderGlobalFields;
  reviewOpen: boolean;
}

interface OrderActions {
  // For products without variants — toggle the whole product
  toggleProduct: (product: ProductSummary) => void;
  // For products with variants — toggle a specific variant
  toggleVariant: (product: ProductSummary, variant: VariantSummary) => void;
  isSelected: (key: string) => boolean;
  setQty: (key: string, qty: number) => void;
  setSalePrice: (key: string, price: string) => void;
  removeItem: (key: string) => void;
  setGlobal: <K extends keyof OrderGlobalFields>(field: K, value: OrderGlobalFields[K]) => void;
  openReview: () => void;
  closeReview: () => void;
  reset: () => void;
}

interface OrderContextValue {
  state: OrderState;
  actions: OrderActions;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function useOrder() {
  const ctx = use(OrderContext);
  if (!ctx) throw new Error('useOrder must be used within OrderProvider');
  return ctx;
}

export function makeKey(productId: number, variantId?: number) {
  return variantId != null ? `${productId}:${variantId}` : String(productId);
}

const defaultGlobal: OrderGlobalFields = { stockOutType: '', note: '', debtorName: '', paidAmount: '' };

export function OrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [global, setGlobalState] = useState<OrderGlobalFields>(defaultGlobal);
  const [reviewOpen, setReviewOpen] = useState(false);

  const toggleProduct = useCallback((product: ProductSummary) => {
    const key = makeKey(product.id);
    setItems((prev) => {
      if (prev.find((i) => i.key === key)) return prev.filter((i) => i.key !== key);
      return [...prev, { key, product, variant: null, quantity: 1, salePrice: '' }];
    });
  }, []);

  const toggleVariant = useCallback((product: ProductSummary, variant: VariantSummary) => {
    const key = makeKey(product.id, variant.id);
    setItems((prev) => {
      if (prev.find((i) => i.key === key)) return prev.filter((i) => i.key !== key);
      return [...prev, { key, product, variant, quantity: 1, salePrice: '' }];
    });
  }, []);

  const isSelected = useCallback((key: string) => {
    return items.some((i) => i.key === key);
  }, [items]);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, quantity: Math.max(1, qty) } : i));
  }, []);

  const setSalePrice = useCallback((key: string, price: string) => {
    setItems((prev) => prev.map((i) => i.key === key ? { ...i, salePrice: price } : i));
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const setGlobal = useCallback(<K extends keyof OrderGlobalFields>(field: K, value: OrderGlobalFields[K]) => {
    setGlobalState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setGlobalState(defaultGlobal);
    setReviewOpen(false);
  }, []);

  return (
    <OrderContext value={{
      state: { items, global, reviewOpen },
      actions: {
        toggleProduct, toggleVariant, isSelected,
        setQty, setSalePrice, removeItem, setGlobal,
        openReview: () => setReviewOpen(true),
        closeReview: () => setReviewOpen(false),
        reset,
      },
    }}>
      {children}
    </OrderContext>
  );
}
