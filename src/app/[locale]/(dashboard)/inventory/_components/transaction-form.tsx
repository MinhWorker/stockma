'use client';

import { useEffect, useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import { FormField } from '@/components/forms/form-field';
import { getMockProducts } from '@/lib/mock/products';
import { createMockTransaction } from '@/lib/mock/transactions';
import type { Product } from '@/types/product';
import type { TransactionFormValues, TransactionType } from '@/types/transaction';

interface TransactionFormErrors {
  type?: string;
  productId?: string;
  quantity?: string;
}

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function emptyValues(): TransactionFormValues {
  return { type: 'stock_in', productId: 0, quantity: 1, note: '' };
}

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'stock_in', label: 'Stock In' },
  { value: 'stock_out', label: 'Stock Out' },
  { value: 'adjustment', label: 'Adjustment' },
];

export function TransactionForm({ open, onOpenChange, onSuccess }: TransactionFormProps) {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');

  const quantityId = useId();
  const noteId = useId();

  const [values, setValues] = useState<TransactionFormValues>(emptyValues);
  const [errors, setErrors] = useState<TransactionFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    getMockProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (open) {
      setValues(emptyValues());
      setErrors({});
      setProductSearch('');
    }
  }, [open]);

  const selectedProduct = products.find((p) => p.id === values.productId);

  function validate(): TransactionFormErrors {
    const errs: TransactionFormErrors = {};
    if (!values.type) errs.type = 'This field is required';
    if (!values.productId) errs.productId = 'This field is required';
    if (!values.quantity || values.quantity < 1 || !Number.isInteger(values.quantity)) {
      errs.quantity = 'Please enter a positive integer';
    }
    return errs;
  }

  function set<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof TransactionFormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    try {
      await createMockTransaction(values);
      toast.success(t('submitSuccess'));
      onSuccess();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredProducts = productSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearch.toLowerCase())
      )
    : products;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('form.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label={t('form.type')} required error={errors.type}>
            <Select value={values.type} onValueChange={(v) => set('type', v as TransactionType)}>
              <SelectTrigger className="w-full" aria-invalid={!!errors.type}>
                <SelectValue placeholder={t('form.typePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map((tt) => (
                  <SelectItem key={tt.value} value={tt.value}>
                    {tt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t('form.product')} required error={errors.productId}>
            <Combobox
              value={values.productId || null}
              onValueChange={(v) => {
                set('productId', v as number);
                setProductSearch('');
              }}
            >
              <ComboboxInput
                placeholder={t('form.productPlaceholder')}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                aria-invalid={!!errors.productId}
                className={errors.productId ? 'border-destructive' : ''}
              />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>{tCommon('noResults')}</ComboboxEmpty>
                  {filteredProducts.map((p) => (
                    <ComboboxItem key={p.id} value={p.id}>
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{p.sku}</span>
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

          <FormField
            label={t('form.quantity')}
            required
            error={errors.quantity}
            htmlFor={quantityId}
          >
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isSubmitting ? tCommon('submitting') : tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
