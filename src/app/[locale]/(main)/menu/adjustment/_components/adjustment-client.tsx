'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
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
import { ProductCombobox } from '@/components/forms/product-combobox';
import { useTransactionForm } from '../../_hooks/use-transaction-form';

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
    handleSubmit,
    handleReset,
    handleClose,
    quantityId,
    noteId,
    t,
    tCommon,
  } = useTransactionForm('adjustment');

  const [variantSearch, setVariantSearch] = useState('');

  const filteredVariants = variantSearch
    ? (selectedProduct?.variants ?? []).filter((v) =>
        v.name.toLowerCase().includes(variantSearch.toLowerCase())
      )
    : (selectedProduct?.variants ?? []);

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
    <div className="space-y-4 px-4 py-4">
      <p className="text-xs text-muted-foreground rounded-xl bg-muted px-3 py-2">
        Nhập số lượng dương để tăng tồn kho, số âm để giảm.
      </p>

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
            {t('form.currentStock', { qty: selectedProduct.stockQty })}
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
        <Input
          id={quantityId}
          type="number"
          step={1}
          value={values.quantity || ''}
          onChange={(e) => set('quantity', Math.floor(Number(e.target.value)))}
          placeholder={t('form.quantityPlaceholder')}
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

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? tCommon('submitting') : tCommon('save')}
      </Button>
    </div>
  );
}
