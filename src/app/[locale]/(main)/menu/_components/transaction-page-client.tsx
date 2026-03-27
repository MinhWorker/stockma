'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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

const TRANSACTION_TYPES: { value: TransactionType; labelKey: string }[] = [
  { value: 'stock_in', labelKey: 'tabs.stockIn' },
  { value: 'stock_out', labelKey: 'tabs.stockOut' },
  { value: 'adjustment', labelKey: 'tabs.adjustments' },
];

interface Props {
  defaultType: TransactionType;
  title: string;
}

function emptyValues(type: TransactionType): TransactionFormValues {
  return { type, productId: 0, quantity: 1, note: '' };
}

export function TransactionPageClient({ defaultType, title }: Props) {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const backTo = (searchParams.get('back') ?? '/menu') as Parameters<typeof router.push>[0];

  const quantityId = useId();
  const noteId = useId();

  const [values, setValues] = useState<TransactionFormValues>(() => emptyValues(defaultType));
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    getMockProducts().then(setProducts);
  }, []);

  const selectedProduct = products.find((p) => p.id === values.productId);

  const filteredProducts = productSearch
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearch.toLowerCase())
      )
    : products;

  function set<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const errs: Partial<Record<keyof TransactionFormValues, string>> = {};
    if (!values.productId) errs.productId = tCommon('required');
    if (!values.quantity || values.quantity < 1) errs.quantity = tCommon('required');
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    try {
      await createMockTransaction(values);
      toast.success(t('submitSuccess'));
      setDone(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setValues(emptyValues(defaultType));
    setErrors({});
    setDone(false);
    setProductSearch('');
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
        <div className="space-y-1">
          <p className="text-lg font-semibold">{t('submitSuccess')}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(backTo)}>
            {tCommon('close')}
          </Button>
          <Button onClick={handleReset}>{t('newTransaction')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-4">
      <p className="text-sm text-muted-foreground">{title}</p>

      <div className="space-y-4">
        <FormField label={t('form.type')} required>
          <Select value={values.type} onValueChange={(v) => set('type', v as TransactionType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((tt) => (
                <SelectItem key={tt.value} value={tt.value}>
                  {t(tt.labelKey as Parameters<typeof t>[0])}
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
      </div>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? tCommon('submitting') : tCommon('save')}
      </Button>
    </div>
  );
}
