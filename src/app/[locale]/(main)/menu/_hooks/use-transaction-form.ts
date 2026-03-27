'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getProductsAction } from '@/actions/products.action';
import { createTransactionAction } from '@/actions/inventory.action';
import type { ProductSummary } from '@/services/types';
import type { TransactionFormValues, TransactionType } from '@/types/transaction';

function emptyValues(type: TransactionType): TransactionFormValues {
  return { type, productId: 0, quantity: 1, note: '' };
}

export function useTransactionForm(defaultType: TransactionType) {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const quantityId = useId();
  const noteId = useId();

  const [values, setValues] = useState<TransactionFormValues>(() => emptyValues(defaultType));
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    getProductsAction().then(setProducts);
  }, []);

  // Derived — no state needed (rerender-derived-state-no-effect)
  const filteredProducts = productSearch
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const selectedProduct = products.find((p) => p.id === values.productId);

  // Stable — uses functional setState, no state deps (rerender-functional-setstate)
  const set = useCallback(
    <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    // Read latest values via functional setState to avoid stale closure
    let snapshot: TransactionFormValues | null = null;
    setValues((prev) => {
      snapshot = prev;
      return prev;
    });

    const current = snapshot as unknown as TransactionFormValues;
    const e: Partial<Record<keyof TransactionFormValues, string>> = {};
    if (!current.productId) e.productId = tCommon('required');
    if (!current.quantity || current.quantity < 1) e.quantity = tCommon('required');

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTransactionAction({
        type: current.type,
        productId: current.productId,
        quantity: current.quantity,
        note: current.note,
        userId: 1, // TODO: replace with session user id
      });
      if (!result.success) throw new Error(result.error);
      toast.success(t('submitSuccess'));
      setDone(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [t, tCommon]);

  const handleReset = useCallback(() => {
    setValues(emptyValues(defaultType));
    setErrors({});
    setDone(false);
    setProductSearch('');
  }, [defaultType]);

  // rerender-defer-reads: read searchParams on demand in callback, not at render
  const handleClose = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const backTo = (params.get('back') ?? '/menu') as Parameters<typeof router.push>[0];
    router.push(backTo);
  }, [router]);

  return {
    values,
    errors,
    isSubmitting,
    done,
    products: filteredProducts,
    productSearch,
    setProductSearch,
    selectedProduct,
    set,
    handleSubmit,
    handleReset,
    handleClose,
    quantityId,
    noteId,
    t,
    tCommon,
  };
}
