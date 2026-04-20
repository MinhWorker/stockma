'use client';

import { useCallback, useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { PriceInput } from '@/components/forms/price-input';
import { ProductCombobox } from '@/components/forms/product-combobox';
import { createReturnAction } from '@/actions/return.action';
import { getErrorKey } from '@/lib/error-message';
import { useWithLoading } from '@/components/feedback/loading-overlay';
import { useInventoryProductState } from '../../_hooks/use-inventory-product-state';
import { VariantChipSelector } from '../../_components/variant-chip-selector';
import { TransactionDoneState } from '../../_components/transaction-done-state';

export function ReturnForm() {
  const tCommon = useTranslations('common');

  const returnQtyId = useId();
  const replacementQtyId = useId();
  const purchasePriceId = useId();
  const noteId = useId();

  const productState = useInventoryProductState();
  const {
    productId, setProductId, variantId, setVariantId, products,
    productSearch, setProductSearch, selectedProduct, hasVariants,
    resetProduct,
  } = productState;

  const [returnQty, setReturnQty] = useState('');
  const [replacementQty, setReplacementQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const withLoading = useWithLoading();
  const [done, setDone] = useState(false);

  function handleProductChange(v: number) {
    setProductId(v);
    setProductSearch('');
    setVariantId(undefined);
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
    await withLoading(async () => {
      try {
        const result = await createReturnAction({
          productId,
          variantId,
          returnQty: rQty,
          replacementQty: repQty,
          purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
          note: note || undefined,
        });
        if (!result.success) { toast.error(tCommon(getErrorKey(result.error))); return; }
        toast.success('Ghi nhận đổi trả thành công');
        setDone(true);
      } catch {
        toast.error(tCommon('error'));
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [productId, variantId, returnQty, replacementQty, purchasePrice, note, tCommon, withLoading]);

  function handleReset() {
    resetProduct();
    setReturnQty('');
    setReplacementQty('');
    setPurchasePrice('');
    setNote('');
    setErrors({});
    setDone(false);
  }

  if (done) {
    return (
      <TransactionDoneState
        title="Ghi nhận đổi trả thành công"
        subtitle=""
        onReset={handleReset}
        onClose={() => window.history.back()}
      />
    );
  }

  return (
    <div className="space-y-4 px-4 py-4" inert={isSubmitting || undefined}>
      {/* Product */}
      <FormField label="Sản phẩm" required error={errors.productId}>
        <ProductCombobox
          products={products}
          productId={productId}
          productSearch={productSearch}
          onProductChange={handleProductChange}
          onSearchChange={(s) => { setProductSearch(s); if (!s) handleProductChange(0); }}
          error={!!errors.productId}
        />
      </FormField>

      {/* Variant — only when product has variants */}
      {hasVariants && (
        <VariantChipSelector
          label="Phân loại"
          variants={selectedProduct?.variants ?? []}
          selectedId={variantId}
          onSelect={(v) => {
            setVariantId(v);
            setErrors((prev) => ({ ...prev, variantId: '' }));
          }}
          error={errors.variantId}
          getPrice={(v) => v.effectivePrice}
        />
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
        <PriceInput
          id={purchasePriceId}
          value={purchasePrice}
          onChange={(v) => setPurchasePrice(String(v || ''))}
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
