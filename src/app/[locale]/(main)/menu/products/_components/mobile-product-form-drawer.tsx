'use client';

import { useEffect, useId, useTransition, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Loader2, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
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
import {
  createProductAction,
  updateProductAction,
  getProductFormDataAction,
  createVariantAction,
  updateVariantAction,
  deleteVariantAction,
} from '@/actions/products.action';
import { getErrorKey } from '@/lib/error-message';
import type { ProductSummary, CategorySummary, ProviderSummary, InventorySummary, VariantSummary } from '@/services/types';

interface FormValues {
  name: string;
  costPrice: number;
  price: number;
  categoryId: number;
  providerId: number;
  inventoryId: number;
  description: string;
  unit: string;
}
type Errors = Partial<Record<keyof FormValues, string>>;

function empty(): FormValues {
  return { name: '', costPrice: 0, price: 0, categoryId: 0, providerId: 0, inventoryId: 0, description: '', unit: '' };
}
function fromProduct(p: ProductSummary): FormValues {
  return {
    name: p.name,
    costPrice: p.costPrice,
    price: p.price,
    categoryId: p.categoryId,
    providerId: p.providerId,
    inventoryId: p.inventoryId,
    description: p.shortDescription ?? '',
    unit: p.unit ?? '',
  };
}

interface VariantFormState {
  name: string;
  costPrice: string;
  price: string;
  unit: string;
}

function emptyVariantForm(): VariantFormState {
  return { name: '', costPrice: '', price: '', unit: '' };
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
  const descId = useId();
  const unitId = useId();

  const [values, setValues] = useState<FormValues>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [inventories, setInventories] = useState<InventorySummary[]>([]);

  // Variant state
  const [variants, setVariants] = useState<VariantSummary[]>([]);
  const [variantForm, setVariantForm] = useState<VariantFormState>(emptyVariantForm);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [variantSubmitting, setVariantSubmitting] = useState(false);

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
      setVariants(product?.variants ?? []);
      setVariantForm(emptyVariantForm());
      setEditingVariantId(null);
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
            categoryId: values.categoryId,
            providerId: values.providerId,
            inventoryId: values.inventoryId,
            shortDescription: values.description,
            unit: values.unit || undefined,
          })
        : await createProductAction({
            name: values.name,
            costPrice: values.costPrice,
            price: values.price,
            categoryId: values.categoryId,
            providerId: values.providerId,
            inventoryId: values.inventoryId,
            shortDescription: values.description,
            unit: values.unit || undefined,
          });
      if (!result.success) {
        toast.error(tCommon(getErrorKey(result.error)));
        return;
      }
      toast.success(t('saveSuccess'));
      onSuccess();
      onOpenChange(false);
      startTransition(() => router.refresh());
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Variant handlers
  function startEditVariant(v: VariantSummary) {
    setEditingVariantId(v.id);
    setVariantForm({
      name: v.name,
      costPrice: v.costPrice != null ? String(v.costPrice) : '',
      price: v.price != null ? String(v.price) : '',
      unit: v.unit ?? '',
    });
  }

  function cancelVariantEdit() {
    setEditingVariantId(null);
    setVariantForm(emptyVariantForm());
  }

  async function handleSaveVariant() {
    if (!variantForm.name.trim()) return;
    if (!product) return;
    setVariantSubmitting(true);
    try {
      if (editingVariantId != null) {
        const result = await updateVariantAction(editingVariantId, {
          name: variantForm.name,
          costPrice: variantForm.costPrice ? Number(variantForm.costPrice) : undefined,
          price: variantForm.price ? Number(variantForm.price) : undefined,
          unit: variantForm.unit || undefined,
        });
        if (!result.success) {
          toast.error(tCommon(getErrorKey(result.error)));
          return;
        }
        if (result.data) {
          setVariants((prev) => prev.map((v) => v.id === editingVariantId ? result.data! : v));
        }
        setEditingVariantId(null);
      } else {
        const result = await createVariantAction({
          productId: product.id,
          name: variantForm.name,
          costPrice: variantForm.costPrice ? Number(variantForm.costPrice) : undefined,
          price: variantForm.price ? Number(variantForm.price) : undefined,
          unit: variantForm.unit || undefined,
        });
        if (!result.success) {
          toast.error(tCommon(getErrorKey(result.error)));
          return;
        }
        if (result.data) {
          setVariants((prev) => [...prev, result.data!]);
        }
      }
      setVariantForm(emptyVariantForm());
      startTransition(() => router.refresh());
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setVariantSubmitting(false);
    }
  }

  async function handleDeleteVariant(variantId: number) {
    setVariantSubmitting(true);
    try {
      const result = await deleteVariantAction(variantId);
      if (!result.success) {
        toast.error(tCommon(getErrorKey(result.error)));
        return;
      }
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      startTransition(() => router.refresh());
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setVariantSubmitting(false);
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
          <FormField label="Đơn vị tính" htmlFor={unitId}>
            <Input
              id={unitId}
              value={values.unit}
              onChange={(e) => set('unit', e.target.value)}
              placeholder="Ví dụ: hộp, cái, kg..."
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

          {/* Variant section — only shown when editing an existing product */}
          {product && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-semibold">Phân loại</p>

              {/* Existing variants */}
              {variants.map((v) =>
                editingVariantId === v.id ? (
                  <div key={v.id} className="space-y-2 rounded-md border p-3 bg-muted/30">
                    <Input
                      placeholder="Tên phân loại"
                      value={variantForm.name}
                      onChange={(e) => setVariantForm((f) => ({ ...f, name: e.target.value }))}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        placeholder="Giá nhập"
                        value={variantForm.costPrice}
                        onChange={(e) => setVariantForm((f) => ({ ...f, costPrice: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="Giá bán"
                        value={variantForm.price}
                        onChange={(e) => setVariantForm((f) => ({ ...f, price: e.target.value }))}
                      />
                      <Input
                        placeholder="Đơn vị"
                        value={variantForm.unit}
                        onChange={(e) => setVariantForm((f) => ({ ...f, unit: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveVariant} disabled={variantSubmitting}>
                        {variantSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Lưu
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelVariantEdit}>
                        <X className="h-3 w-3" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{v.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {v.effectiveCostPrice.toLocaleString()} / {v.effectivePrice.toLocaleString()}
                        {v.effectiveUnit ? ` · ${v.effectiveUnit}` : ''}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">Tồn: {v.stockQty}</span>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditVariant(v)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteVariant(v.id)}
                        disabled={variantSubmitting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              )}

              {/* Add new variant row */}
              {editingVariantId === null && (
                <div className="space-y-2 rounded-md border border-dashed p-3">
                  <Input
                    placeholder="Tên phân loại mới"
                    value={variantForm.name}
                    onChange={(e) => setVariantForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      placeholder="Giá nhập"
                      value={variantForm.costPrice}
                      onChange={(e) => setVariantForm((f) => ({ ...f, costPrice: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Giá bán"
                      value={variantForm.price}
                      onChange={(e) => setVariantForm((f) => ({ ...f, price: e.target.value }))}
                    />
                    <Input
                      placeholder="Đơn vị"
                      value={variantForm.unit}
                      onChange={(e) => setVariantForm((f) => ({ ...f, unit: e.target.value }))}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveVariant}
                    disabled={variantSubmitting || !variantForm.name.trim()}
                  >
                    {variantSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                    Thêm phân loại
                  </Button>
                </div>
              )}
            </div>
          )}
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
