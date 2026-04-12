'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getProductsAction } from '@/actions/products.action';
import { createTransactionAction } from '@/actions/inventory.action';
import { useSession } from '@/lib/auth-client';
import { getErrorKey } from '@/lib/error-message';
import type { ProductSummary } from '@/services/types';
import type { TransactionFormValues, TransactionType } from '@/types/transaction';

function emptyValues(type: TransactionType): TransactionFormValues {
  return { type, productId: 0, quantity: type === 'adjustment' ? 0 : 1, note: '' };
}

export function useTransactionForm(defaultType: TransactionType) {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { data: session } = useSession();

  const quantityId = useId();
  const noteId = useId();

  const [values, setValues] = useState<TransactionFormValues>(() => emptyValues(defaultType));
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    getProductsAction().then(setProducts);
  }, []);

  const selectedProduct = products.find((p) => p.id === values.productId);
  const hasVariants = (selectedProduct?.variants?.length ?? 0) > 0;
  const selectedVariant = selectedProduct?.variants?.find((v) => v.id === values.variantId);

  // Stable — uses functional setState, no state deps (rerender-functional-setstate)
  const set = useCallback(
    <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  // Show selected product name in input when not actively searching
  const productInputValue = values.productId && !productSearch
    ? (selectedProduct?.name ?? '')
    : productSearch;

  const handleProductSearch = useCallback((v: string) => {
    setProductSearch(v);
    if (!v) { set('productId', 0); set('variantId', undefined); }
  }, [set]);

  // Derived — no state needed (rerender-derived-state-no-effect)
  const filteredProducts = productSearch
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const validate = useCallback(() => {
    const current = valuesRef.current;
    const e: Partial<Record<keyof TransactionFormValues, string>> = {};
    if (!current.productId) e.productId = tCommon('required');
    if (current.type === 'adjustment') {
      if (current.quantity === 0) e.quantity = tCommon('required');
      else {
        const prod = products.find((p) => p.id === current.productId);
        const currentStock = current.variantId
          ? (prod?.variants?.find((v) => v.id === current.variantId)?.stockQty ?? 0)
          : (prod?.stockQty ?? 0);
        if (currentStock + current.quantity < 0) e.quantity = tCommon('errInsufficientStock');
      }
    } else {
      if (!current.quantity || current.quantity < 1) e.quantity = tCommon('required');
    }
    const product = products.find((p) => p.id === current.productId);
    if ((product?.variants?.length ?? 0) > 0 && !current.variantId) {
      e.variantId = tCommon('required');
    }
    if (Object.keys(e).length) setErrors(e);
    return Object.keys(e).length === 0;
  }, [products, tCommon]);

  const submitConfirmed = useCallback(async () => {
    const current = valuesRef.current;
    setIsSubmitting(true);
    try {
      const result = await createTransactionAction({
        type: current.type,
        productId: current.productId,
        variantId: current.variantId,
        quantity: current.quantity,
        note: current.note,
        userId: session?.user?.id ?? '',
      });
      if (!result.success) {
        toast.error(tCommon(getErrorKey(result.error)));
        return;
      }
      toast.success(t('submitSuccess'));
      setDone(true);
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [t, tCommon, session]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    await submitConfirmed();
  }, [validate, submitConfirmed]);

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
    productInputValue,
    setProductSearch,
    handleProductSearch,
    selectedProduct,
    hasVariants,
    selectedVariant,
    set,
    handleSubmit,
    validate,
    submitConfirmed,
    handleReset,
    handleClose,
    quantityId,
    noteId,
    t,
    tCommon,
  };
}
