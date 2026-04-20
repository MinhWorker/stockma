'use client';

import { useCallback, useId, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { PriceInput } from '@/components/forms/price-input';
import { ProductCombobox } from '@/components/forms/product-combobox';
import { createTransactionAction } from '@/actions/inventory.action';
import { useSession } from '@/lib/auth-client';
import { getErrorKey } from '@/lib/error-message';
import { useWithLoading } from '@/components/feedback/loading-overlay';
import { useInventoryProductState } from '../../_hooks/use-inventory-product-state';
import { VariantChipSelector } from '../../_components/variant-chip-selector';
import { TransactionDoneState } from '../../_components/transaction-done-state';

export function StockInClient() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { data: session } = useSession();

  const quantityId = useId();
  const noteId = useId();

  const productState = useInventoryProductState();
  const {
    productId, setProductId, variantId, setVariantId, products,
    productSearch, setProductSearch, selectedProduct, hasVariants,
    selectedVariant, resetProduct,
  } = productState;

  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const withLoading = useWithLoading();
  const [done, setDone] = useState(false);

  const effectiveCostPrice = selectedVariant?.effectiveCostPrice ?? selectedProduct?.costPrice;

  function handleProductChange(v: number) {
    setProductId(v);
    setProductSearch('');
    setVariantId(undefined);
    setPurchasePrice('');
    setErrors((prev) => ({ ...prev, productId: '' }));
  }

  const handleSubmit = useCallback(async () => {
    const e: Record<string, string> = {};
    if (!productId) e.productId = tCommon('required');
    if (!quantity || quantity < 1) e.quantity = tCommon('required');
    if (hasVariants && !variantId) e.variantId = tCommon('required');
    if (Object.keys(e).filter((k) => e[k]).length) {
      setErrors(e);
      return;
    }

    setIsSubmitting(true);
    await withLoading(async () => {
      try {
        const result = await createTransactionAction({
          type: 'stock_in',
          productId,
          quantity,
          note: note || undefined,
          userId: session?.user?.id ?? '',
          variantId,
          purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        });
        if (!result.success) { toast.error(tCommon(getErrorKey(result.error))); return; }
        toast.success(t('submitSuccess'));
        setDone(true);
      } catch {
        toast.error(tCommon('error'));
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [productId, quantity, note, variantId, purchasePrice, hasVariants, session, t, tCommon, withLoading]);

  function handleReset() {
    resetProduct();
    setQuantity(1);
    setNote('');
    setPurchasePrice('');
    setErrors({});
    setDone(false);
  }

  function handleClose() {
    const params = new URLSearchParams(window.location.search);
    const backTo = (params.get('back') ?? '/menu') as Parameters<typeof router.push>[0];
    router.push(backTo);
  }

  if (done) {
    return (
      <TransactionDoneState
        title={t('submitSuccess')}
        subtitle={t('tabs.stockIn')}
        onReset={handleReset}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="space-y-4 px-4 py-4" inert={isSubmitting || undefined}>
      <FormField label={t('form.product')} required error={errors.productId}>
        <ProductCombobox
          products={products}
          productId={productId}
          productSearch={productSearch}
          onProductChange={handleProductChange}
          onSearchChange={(s) => { setProductSearch(s); if (!s) handleProductChange(0); }}
          error={!!errors.productId}
          addNewHref="/menu/products/new?back=/menu/stock-in"
        />
        {selectedProduct && (
          <p className="text-xs text-muted-foreground mt-1">
            {t('form.currentStock', { qty: selectedProduct.stockQty })}
          </p>
        )}
      </FormField>

      {hasVariants && (
        <VariantChipSelector
          label={t('form.variant')}
          required
          variants={selectedProduct?.variants ?? []}
          selectedId={variantId}
          onSelect={(v) => {
            setVariantId(v);
            setPurchasePrice('');
            setErrors((prev) => ({ ...prev, variantId: '' }));
          }}
          error={errors.variantId}
          getPrice={(v) => v.effectiveCostPrice}
        />
      )}

      <FormField label={t('form.quantity')} required error={errors.quantity} htmlFor={quantityId}>
        <Input
          id={quantityId}
          inputMode="numeric"
          pattern="[0-9]*"
          value={quantity || ''}
          onChange={(e) => {
            const parsed = Math.floor(Number(e.target.value.replace(/[^0-9]/g, '')));
            setQuantity(parsed || 0);
            setErrors((prev) => ({ ...prev, quantity: '' }));
          }}
          placeholder={t('form.quantityPlaceholder')}
          aria-invalid={!!errors.quantity}
        />
      </FormField>

      <FormField label={t('form.purchasePrice')}>
        <PriceInput
          value={purchasePrice}
          onChange={(v) => setPurchasePrice(String(v || ''))}
          placeholder={effectiveCostPrice != null
            ? `${t('form.purchasePriceDefault')}: ${effectiveCostPrice.toLocaleString()}`
            : t('form.purchasePricePlaceholder')}
        />
      </FormField>

      <FormField label={t('form.note')} htmlFor={noteId}>
        <Textarea
          id={noteId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('form.notePlaceholder')}
          rows={3}
        />
      </FormField>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? tCommon('submitting') : tCommon('save')}
      </Button>
    </div>
  );
}
