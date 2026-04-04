'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import { getProductsAction } from '@/actions/products.action';
import { createReturnAction } from '@/actions/return.action';
import { getErrorKey } from '@/lib/error-message';
import type { ProductSummary } from '@/services/types';

export function ReturnForm() {
  const tCommon = useTranslations('common');

  const returnQtyId = useId();
  const replacementQtyId = useId();
  const purchasePriceId = useId();
  const noteId = useId();

  const [productId, setProductId] = useState<number>(0);
  const [variantId, setVariantId] = useState<number | undefined>(undefined);
  const [returnQty, setReturnQty] = useState('');
  const [replacementQty, setReplacementQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [variantSearch, setVariantSearch] = useState('');

  useEffect(() => {
    getProductsAction().then(setProducts);
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);
  const hasVariants = (selectedProduct?.variants?.length ?? 0) > 0;
  const selectedVariant = selectedProduct?.variants?.find((v) => v.id === variantId);

  const productInputValue = productId && !productSearch
    ? (selectedProduct?.name ?? '')
    : productSearch;

  const filteredProducts = productSearch
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const filteredVariants = variantSearch
    ? (selectedProduct?.variants ?? []).filter((v) =>
        v.name.toLowerCase().includes(variantSearch.toLowerCase())
      )
    : (selectedProduct?.variants ?? []);

  function handleProductChange(v: number) {
    setProductId(v);
    setProductSearch('');
    setVariantId(undefined);
    setVariantSearch('');
    setErrors((prev) => ({ ...prev, productId: '' }));
  }

  const handleSubmit = useCallback(async () => {
    const rQty = Number(returnQty) || 0;
    const repQty = Number(replacementQty) || 0;

    const e: Record<string, string> = {};
    if (!productId) e.productId = tCommon('required');
    if (rQty < 0) e.returnQty = 'Phải >= 0';
    if (repQty < 0) e.replacementQty = 'Phải >= 0';
    if (rQty + repQty === 0) e.returnQty = 'Tổng số lượng phải > 0';

    if (Object.keys(e).filter((k) => e[k]).length) {
      setErrors(e);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createReturnAction({
        productId,
        variantId,
        returnQty: rQty,
        replacementQty: repQty,
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        note: note || undefined,
      });
      if (!result.success) {
        toast.error(tCommon(getErrorKey(result.error)));
        return;
      }
      toast.success('Ghi nhận đổi trả thành công');
      setDone(true);
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [productId, variantId, returnQty, replacementQty, purchasePrice, note, tCommon]);

  function handleReset() {
    setProductId(0);
    setVariantId(undefined);
    setReturnQty('');
    setReplacementQty('');
    setPurchasePrice('');
    setNote('');
    setProductSearch('');
    setVariantSearch('');
    setErrors({});
    setDone(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
        <div className="space-y-1">
          <p className="text-lg font-semibold">Ghi nhận đổi trả thành công</p>
        </div>
        <Button onClick={handleReset}>Đổi trả mới</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {/* Product */}
      <FormField label="Sản phẩm" required error={errors.productId}>
        <Combobox
          value={productId || null}
          onValueChange={(v) => handleProductChange(v as number)}
        >
          <ComboboxInput
            placeholder="Tìm sản phẩm..."
            value={productInputValue}
            onChange={(e) => {
              setProductSearch(e.target.value);
              if (!e.target.value) handleProductChange(0);
            }}
            aria-invalid={!!errors.productId}
          />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>{tCommon('noResults')}</ComboboxEmpty>
              {filteredProducts.map((p) => (
                <ComboboxItem key={p.id} value={p.id}>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{p.categoryName}</span>
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </FormField>

      {/* Variant — only when product has variants */}
      {hasVariants && (
        <FormField label="Phân loại">
          <Combobox
            value={variantId ?? null}
            onValueChange={(v) => {
              setVariantId(v as number | undefined);
              setVariantSearch('');
            }}
          >
            <ComboboxInput
              placeholder="Chọn phân loại (tùy chọn)..."
              value={variantId && !variantSearch
                ? (selectedVariant?.name ?? '')
                : variantSearch}
              onChange={(e) => {
                setVariantSearch(e.target.value);
                if (!e.target.value) setVariantId(undefined);
              }}
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>{tCommon('noResults')}</ComboboxEmpty>
                {filteredVariants.map((v) => (
                  <ComboboxItem key={v.id} value={v.id}>
                    <span className="flex-1 truncate">{v.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {v.effectivePrice.toLocaleString()}
                    </span>
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </FormField>
      )}

      {/* Return qty */}
      <FormField label="Số lượng trả" required error={errors.returnQty} htmlFor={returnQtyId}>
        <Input
          id={returnQtyId}
          type="number"
          min={0}
          value={returnQty}
          onChange={(e) => {
            setReturnQty(e.target.value);
            setErrors((prev) => ({ ...prev, returnQty: '' }));
          }}
          placeholder="0"
          aria-invalid={!!errors.returnQty}
        />
      </FormField>

      {/* Replacement qty */}
      <FormField label="Số lượng đổi" required error={errors.replacementQty} htmlFor={replacementQtyId}>
        <Input
          id={replacementQtyId}
          type="number"
          min={0}
          value={replacementQty}
          onChange={(e) => {
            setReplacementQty(e.target.value);
            setErrors((prev) => ({ ...prev, replacementQty: '' }));
          }}
          placeholder="0"
          aria-invalid={!!errors.replacementQty}
        />
      </FormField>

      {/* Purchase price — optional */}
      <FormField label="Giá nhập hàng đổi" htmlFor={purchasePriceId}>
        <Input
          id={purchasePriceId}
          type="number"
          min={0}
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          placeholder="Giá nhập (tùy chọn)"
        />
      </FormField>

      {/* Note */}
      <FormField label="Ghi chú" htmlFor={noteId}>
        <Textarea
          id={noteId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Lý do đổi trả..."
          rows={3}
        />
      </FormField>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? tCommon('submitting') : 'Ghi nhận đổi trả'}
      </Button>
    </div>
  );
}
