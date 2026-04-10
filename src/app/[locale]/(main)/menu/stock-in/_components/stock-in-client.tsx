'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { PriceInput } from '@/components/forms/price-input';
import { ProductCombobox } from '@/components/forms/product-combobox';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import { getProductsAction } from '@/actions/products.action';
import { createTransactionAction } from '@/actions/inventory.action';
import { useSession } from '@/lib/auth-client';
import { getErrorKey } from '@/lib/error-message';
import { useWithLoading } from '@/components/feedback/loading-overlay';
import type { ProductSummary } from '@/services/types';

export function StockInClient() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { data: session } = useSession();

  const quantityId = useId();
  const noteId = useId();

  const [productId, setProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [variantId, setVariantId] = useState<number | undefined>(undefined);
  const [purchasePrice, setPurchasePrice] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const withLoading = useWithLoading();
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
  const effectiveCostPrice = selectedVariant?.effectiveCostPrice ?? selectedProduct?.costPrice;

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
    setPurchasePrice('');
    setErrors((prev) => ({ ...prev, productId: '' }));
  }

  const handleSubmit = useCallback(async () => {
    const e: Record<string, string> = {};
    if (!productId) e.productId = tCommon('required');
    if (!quantity || quantity < 1) e.quantity = tCommon('required');
    // Rule: products with variants require a variant to be selected
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
  }, [productId, quantity, note, variantId, purchasePrice, hasVariants, session, t, tCommon]);

  function handleReset() {
    setProductId(0);
    setQuantity(1);
    setNote('');
    setVariantId(undefined);
    setPurchasePrice('');
    setProductSearch('');
    setVariantSearch('');
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
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
        <div className="space-y-1">
          <p className="text-lg font-semibold">{t('submitSuccess')}</p>
          <p className="text-sm text-muted-foreground">{t('tabs.stockIn')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="min-h-[44px]" onClick={handleClose}>
            {tCommon('close')}
          </Button>
          <Button className="min-h-[44px]" onClick={handleReset}>{t('newTransaction')}</Button>
        </div>
      </div>
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
        />
        {selectedProduct && (
          <p className="text-xs text-muted-foreground mt-1">
            {t('form.currentStock', { qty: selectedProduct.stockQty })}
          </p>
        )}
      </FormField>

      {/* Variant selector — required when product has variants */}
      {hasVariants && (
        <FormField label={t('form.variant')} required error={errors.variantId}>
          <Combobox
            value={variantId ?? null}
            onValueChange={(v) => {
              setVariantId(v as number | undefined);
              setVariantSearch('');
              setPurchasePrice('');
              setErrors((prev) => ({ ...prev, variantId: '' }));
            }}
          >
            <ComboboxInput
              placeholder={t('form.variantPlaceholder')}
              value={variantId && !variantSearch
                ? (selectedVariant?.name ?? '')
                : variantSearch}
              onChange={(e) => {
                setVariantSearch(e.target.value);
                if (!e.target.value) setVariantId(undefined);
              }}
              aria-invalid={!!errors.variantId}
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty>{tCommon('noResults')}</ComboboxEmpty>
                {filteredVariants.map((v) => (
                  <ComboboxItem key={v.id} value={v.id}>
                    <span className="flex-1 truncate">{v.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {v.effectiveCostPrice.toLocaleString()} / {v.effectivePrice.toLocaleString()}
                    </span>
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </FormField>
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

      {/* Purchase price — optional */}
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
