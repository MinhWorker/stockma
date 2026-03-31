'use client';

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
import { useTransactionForm } from '../../_hooks/use-transaction-form';

export function StockOutClient() {
  const {
    values,
    errors,
    isSubmitting,
    done,
    products,
    productInputValue,
    handleProductSearch,
    selectedProduct,
    set,
    handleSubmit,
    handleReset,
    handleClose,
    quantityId,
    noteId,
    t,
    tCommon,
  } = useTransactionForm('stock_out');

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 px-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
        <div className="space-y-1">
          <p className="text-lg font-semibold">{t('submitSuccess')}</p>
          <p className="text-sm text-muted-foreground">{t('tabs.stockOut')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose}>
            {tCommon('close')}
          </Button>
          <Button onClick={handleReset}>{t('newTransaction')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <FormField label={t('form.product')} required error={errors.productId}>
        <Combobox
          value={values.productId || null}
          onValueChange={(v) => set('productId', v as number)}
        >
          <ComboboxInput
            placeholder={t('form.productPlaceholder')}
            value={productInputValue}
            onChange={(e) => handleProductSearch(e.target.value)}
            aria-invalid={!!errors.productId}
          />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxEmpty>{tCommon('noResults')}</ComboboxEmpty>
              {products.map((p) => (
                <ComboboxItem key={p.id} value={p.id}>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{p.categoryName}</span>
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {selectedProduct && (
          <p className="text-xs text-muted-foreground mt-1">
            {t('form.currentStock', { qty: selectedProduct.stockQty })}
          </p>
        )}
      </FormField>

      <FormField label={t('form.quantity')} required error={errors.quantity} htmlFor={quantityId}>
        <Input
          id={quantityId}
          type="number"
          min={1}
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
