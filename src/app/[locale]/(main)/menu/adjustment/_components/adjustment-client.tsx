'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import { ProductCombobox } from '@/components/forms/product-combobox';
import { AdjustmentInput } from '@/components/forms/adjustment-input';
import { useTransactionForm } from '../../_hooks/use-transaction-form';
import { cn } from '@/lib/utils';

export function AdjustmentClient() {
  const {
    values,
    errors,
    isSubmitting,
    done,
    products,
    productSearch,
    handleProductSearch,
    selectedProduct,
    hasVariants,
    selectedVariant,
    set,
    validate,
    submitConfirmed,
    handleReset,
    handleClose,
    quantityId,
    noteId,
    t,
    tCommon,
  } = useTransactionForm('adjustment');

  const [variantSearch, setVariantSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filteredVariants = variantSearch
    ? (selectedProduct?.variants ?? []).filter((v) =>
        v.name.toLowerCase().includes(variantSearch.toLowerCase())
      )
    : (selectedProduct?.variants ?? []);

  // Compute current stock for the selected product/variant
  const currentStock = values.variantId
    ? (selectedProduct?.variants?.find((v) => v.id === values.variantId)?.stockQty ?? 0)
    : (selectedProduct?.stockQty ?? 0);
  const futureStock = currentStock + values.quantity;
  const isIncrease = values.quantity > 0;

  function handleSaveClick() {
    if (!validate()) return;
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setConfirmOpen(false);
    await submitConfirmed();
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
        <div className="space-y-1">
          <p className="text-lg font-semibold">{t('submitSuccess')}</p>
          <p className="text-sm text-muted-foreground">{t('tabs.adjustments')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose}>{tCommon('close')}</Button>
          <Button onClick={handleReset}>{t('newTransaction')}</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 px-4 py-4" inert={isSubmitting || undefined}>
        <FormField label={t('form.product')} required error={errors.productId}>
          <ProductCombobox
            products={products}
            productId={values.productId}
            productSearch={productSearch}
            onProductChange={(v) => { set('productId', v); set('variantId', undefined); setVariantSearch(''); }}
            onSearchChange={handleProductSearch}
            error={!!errors.productId}
          />
          {selectedProduct && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('form.currentStock', { qty: currentStock })}
            </p>
          )}
        </FormField>

        {hasVariants && (
          <FormField label={t('form.variant')} required error={errors.variantId}>
            <Combobox
              value={values.variantId ?? null}
              onValueChange={(v) => { set('variantId', v as number | undefined); setVariantSearch(''); }}
            >
              <ComboboxInput
                placeholder={t('form.variantPlaceholder')}
                value={values.variantId && !variantSearch ? (selectedVariant?.name ?? '') : variantSearch}
                onChange={(e) => { setVariantSearch(e.target.value); if (!e.target.value) set('variantId', undefined); }}
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
          <AdjustmentInput
            value={values.quantity}
            onChange={(v) => set('quantity', v)}
            disabled={isSubmitting}
            aria-invalid={!!errors.quantity}
          />
        </FormField>

        <FormField label={t('form.note')} htmlFor={noteId}>
          <Textarea
            id={noteId}
            value={values.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder={t('form.notePlaceholder')}
            rows={3}
          />
        </FormField>

        <Button className="w-full" size="lg" onClick={handleSaveClick} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? tCommon('submitting') : tCommon('save')}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(o) => { if (!o) setConfirmOpen(false); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('adjustConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {isIncrease
                ? t('adjustConfirmIncrease', { qty: values.quantity })
                : t('adjustConfirmDecrease', { qty: Math.abs(values.quantity) })}
            </DialogDescription>
          </DialogHeader>

          {/* Stock preview */}
          <div className="flex items-center justify-between rounded-xl bg-muted px-5 py-4 my-1">
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground mb-1">{t('form.currentStock', { qty: '' }).replace(': ', '')}</p>
              <p className="text-2xl font-bold tabular-nums">{currentStock}</p>
            </div>
            <div className="text-center px-3">
              <p className={cn(
                'text-xl font-bold tabular-nums',
                isIncrease ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
              )}>
                {isIncrease ? `+${values.quantity}` : values.quantity}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground mb-1">{t('adjustConfirmDesc', { after: '' }).replace(': ', '')}</p>
              <p className="text-2xl font-bold tabular-nums">{futureStock}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : tCommon('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
