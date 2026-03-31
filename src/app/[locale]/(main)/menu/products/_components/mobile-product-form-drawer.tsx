'use client';

import { useEffect, useId, useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
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
import { FormField } from '@/components/forms/form-field';
import { createProductAction, updateProductAction, getProductFormDataAction } from '@/actions/products.action';
import { getErrorKey } from '@/lib/error-message';
import type { ProductSummary, CategorySummary, ProviderSummary, InventorySummary } from '@/services/types';

interface FormValues {
  name: string;
  costPrice: number;
  price: number;
  reorderLevel: number;
  categoryId: number;
  providerId: number;
  inventoryId: number;
  description: string;
}
type Errors = Partial<Record<keyof FormValues, string>>;

function empty(): FormValues {
  return { name: '', costPrice: 0, price: 0, reorderLevel: 5, categoryId: 0, providerId: 0, inventoryId: 0, description: '' };
}
function fromProduct(p: ProductSummary): FormValues {
  return {
    name: p.name,
    costPrice: p.costPrice,
    price: p.price,
    reorderLevel: p.reorderLevel,
    categoryId: p.categoryId,
    providerId: p.providerId,
    inventoryId: p.inventoryId,
    description: p.shortDescription ?? '',
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductSummary;
  onSuccess: () => void;
}

export function MobileProductFormDrawer({ open, onOpenChange, product, onSuccess }: Props) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [, startTransition] = useTransition();

  const nameId = useId();
  const costId = useId();
  const priceId = useId();
  const reorderId = useId();
  const descId = useId();

  const [values, setValues] = useState<FormValues>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [inventories, setInventories] = useState<InventorySummary[]>([]);

  useEffect(() => {
    getProductFormDataAction().then(({ categories, providers, inventories }) => {
      setCategories(categories);
      setProviders(providers);
      setInventories(inventories);
    });
  }, []);

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
    if (!values.providerId) e.providerId = tCommon('required');
    if (!values.inventoryId) e.inventoryId = tCommon('required');
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
            providerId: values.providerId,
            inventoryId: values.inventoryId,
            shortDescription: values.description,
          })
        : await createProductAction({
            name: values.name,
            costPrice: values.costPrice,
            price: values.price,
            reorderLevel: values.reorderLevel,
            categoryId: values.categoryId,
            providerId: values.providerId,
            inventoryId: values.inventoryId,
            shortDescription: values.description,
          });
      if (!result.success) {
        toast.error(tCommon(getErrorKey(result.error)));
        return;
      }
      toast.success(t('saveSuccess'));
      onSuccess();
      onOpenChange(false);
      console.log('[product-form] mutation done → calling router.refresh()');
      startTransition(() => router.refresh());
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle>{product ? t('editProduct') : t('addProduct')}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 space-y-4 pb-2">
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
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label={t('form.provider')} required error={errors.providerId}>
            <Select
              value={values.providerId ? String(values.providerId) : ''}
              onValueChange={(v) => set('providerId', Number(v))}
            >
              <SelectTrigger className="w-full" aria-invalid={!!errors.providerId}>
                <SelectValue placeholder={t('form.providerPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label={t('form.inventory')} required error={errors.inventoryId}>
            <Select
              value={values.inventoryId ? String(values.inventoryId) : ''}
              onValueChange={(v) => set('inventoryId', Number(v))}
            >
              <SelectTrigger className="w-full" aria-invalid={!!errors.inventoryId}>
                <SelectValue placeholder={t('form.inventoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {inventories.map((inv) => (
                  <SelectItem key={inv.id} value={String(inv.id)}>
                    {inv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
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
          <FormField label={t('form.description')} htmlFor={descId}>
            <Textarea
              id={descId}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
              rows={3}
            />
          </FormField>
        </div>
        <DrawerFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {tCommon('cancel')}
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? tCommon('saving') : tCommon('save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
