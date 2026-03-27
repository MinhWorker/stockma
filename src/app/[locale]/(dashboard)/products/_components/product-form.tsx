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
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { createProductAction, updateProductAction } from '@/actions/products.action';
import type { ProductSummary } from '@/services/types';

interface FormValues {
  name: string;
  costPrice: number;
  price: number;
  reorderLevel: number;
  categoryId: number;
  description: string;
}

type Errors = Partial<Record<keyof FormValues, string>>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductSummary;
  categories: { id: number; name: string }[];
  /** Called after successful save — caller handles refresh */
  onSuccess: () => void;
}

function empty(): FormValues {
  return { name: '', costPrice: 0, price: 0, reorderLevel: 5, categoryId: 0, description: '' };
}

function fromProduct(p: ProductSummary): FormValues {
  return {
    name: p.name,
    costPrice: p.costPrice,
    price: p.price,
    reorderLevel: p.reorderLevel,
    categoryId: p.categoryId,
    description: p.shortDescription ?? '',
  };
}

export function ProductForm({ open, onOpenChange, product, categories, onSuccess }: Props) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  const nameId = useId();
  const costId = useId();
  const priceId = useId();
  const reorderId = useId();
  const descId = useId();

  const [values, setValues] = useState<FormValues>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(product ? fromProduct(product) : empty());
      setErrors({});
    }
  }, [open, product]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!values.name.trim()) e.name = tCommon('required');
    if (!values.categoryId) e.categoryId = tCommon('required');
    if (!values.costPrice || values.costPrice <= 0) e.costPrice = tCommon('required');
    if (!values.price || values.price <= 0) e.price = tCommon('required');
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = product
        ? await updateProductAction(product.id, {
            name: values.name,
            costPrice: values.costPrice,
            price: values.price,
            reorderLevel: values.reorderLevel,
            categoryId: values.categoryId,
            shortDescription: values.description,
          })
        : await createProductAction({
            name: values.name,
            costPrice: values.costPrice,
            price: values.price,
            reorderLevel: values.reorderLevel,
            categoryId: values.categoryId,
            providerId: 1,
            inventoryId: 1,
            shortDescription: values.description,
          });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('saveSuccess'));
      onSuccess();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? t('editProduct') : t('addProduct')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <FormSection title={t('form.basicInfo')} description={t('form.basicInfoDesc')}>
            <div className="grid grid-cols-1 gap-4">
              <FormField label={t('form.name')} required error={errors.name} htmlFor={nameId}>
                <Input
                  id={nameId}
                  value={values.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder={t('form.namePlaceholder')}
                  aria-invalid={!!errors.name}
                />
              </FormField>
              <FormField label={t('form.category')} required error={errors.categoryId}>
                <Select
                  value={values.categoryId ? String(values.categoryId) : ''}
                  onValueChange={(v) => set('categoryId', Number(v))}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!errors.categoryId}>
                    <SelectValue placeholder={t('form.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </FormSection>

          <FormSection title={t('form.pricing')} description={t('form.pricingDesc')}>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t('form.costPrice')}
                required
                error={errors.costPrice}
                htmlFor={costId}
              >
                <Input
                  id={costId}
                  type="number"
                  min={0}
                  value={values.costPrice || ''}
                  onChange={(e) => set('costPrice', Number(e.target.value))}
                  aria-invalid={!!errors.costPrice}
                />
              </FormField>
              <FormField
                label={t('form.retailPrice')}
                required
                error={errors.price}
                htmlFor={priceId}
              >
                <Input
                  id={priceId}
                  type="number"
                  min={0}
                  value={values.price || ''}
                  onChange={(e) => set('price', Number(e.target.value))}
                  aria-invalid={!!errors.price}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title={t('form.stock')} description={t('form.stockDesc')}>
            <FormField label={t('form.reorderLevel')} required htmlFor={reorderId}>
              <Input
                id={reorderId}
                type="number"
                min={0}
                value={values.reorderLevel}
                onChange={(e) => set('reorderLevel', Number(e.target.value))}
                placeholder={t('form.reorderLevelPlaceholder')}
              />
            </FormField>
          </FormSection>

          <FormSection title={t('form.notes')} description={t('form.notesDesc')}>
            <FormField label={t('form.description')} htmlFor={descId}>
              <Textarea
                id={descId}
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder={t('form.descriptionPlaceholder')}
                rows={3}
              />
            </FormField>
          </FormSection>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isSubmitting ? tCommon('saving') : tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
