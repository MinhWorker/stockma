'use client';

import { useEffect, useId, useState } from 'react';
import { Loader2, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useScrollIntoViewOnFocus } from '@/hooks/use-scroll-into-view-on-focus';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PriceInput } from '@/components/forms/price-input';
import { FormField } from '@/components/forms/form-field';
import { MobileSelectSheet } from '@/components/forms/mobile-select-sheet';
import {
  createProductAction,
  updateProductAction,
  getProductFormDataAction,
  syncVariantsAction,
} from '@/actions/products.action';
import type { VariantPendingOp } from '@/actions/products.action';
import { getErrorKey } from '@/lib/error-message';
import type { ProductSummary, CategorySummary, ProviderSummary, InventorySummary, VariantSummary } from '@/services/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// A local variant row — may be persisted (has real id) or pending-create (negative temp id)
interface LocalVariant {
  id: number; // negative = temp (not yet in DB)
  name: string;
  costPrice: number;
  price: number;
  unit: string;
  stockQty: number;
}

interface VariantFormState {
  name: string;
  costPrice: string;
  price: string;
  unit: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tempIdCounter = -1;
function nextTempId() { return tempIdCounter--; }

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
function emptyVariantForm(): VariantFormState {
  return { name: '', costPrice: '', price: '', unit: '' };
}
function variantFromSummary(v: VariantSummary): LocalVariant {
  return { id: v.id, name: v.name, costPrice: v.costPrice ?? v.effectiveCostPrice, price: v.price ?? v.effectivePrice, unit: v.unit ?? '', stockQty: v.stockQty };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductSummary;
  onSuccess: () => void;
}

export function MobileProductFormDrawer({ open, onOpenChange, product, onSuccess }: Props) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const { onFocus: scrollOnFocus } = useScrollIntoViewOnFocus();

  const nameId = useId();
  const costId = useId();
  const priceId = useId();
  const descId = useId();
  const unitId = useId();

  // Product fields
  const [values, setValues] = useState<FormValues>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [inventories, setInventories] = useState<InventorySummary[]>([]);

  // Local variant state — all changes are pending until Save
  const [localVariants, setLocalVariants] = useState<LocalVariant[]>([]);
  const [pendingOps, setPendingOps] = useState<VariantPendingOp[]>([]);
  const [variantForm, setVariantForm] = useState<VariantFormState>(emptyVariantForm);
  const [variantErrors, setVariantErrors] = useState<{ name?: string; costPrice?: string; price?: string }>({});
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);

  // Disable form interactions until the drawer open animation completes —
  // prevents the virtual keyboard from opening before the drawer has settled,
  // which causes the footer not to sit above the keyboard on first focus.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!open) { setReady(false); }
  }, [open]);

  // Discard-warning dialog
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const hasPendingVariantChanges = pendingOps.length > 0;
  const hasVariants = localVariants.length > 0;

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
      setLocalVariants(product?.variants.map(variantFromSummary) ?? []);
      setPendingOps([]);
      setVariantForm(emptyVariantForm());
      setVariantErrors({});
      setEditingVariantId(null);
    }
  }, [open, product]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // Try to close — warn if there are unsaved variant changes
  function requestClose() {
    if (hasPendingVariantChanges) {
      setShowDiscardDialog(true);
    } else {
      onOpenChange(false);
    }
  }

  function discardAndClose() {
    setShowDiscardDialog(false);
    onOpenChange(false);
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validate(): Errors {
    const e: Errors = {};
    if (!values.name.trim()) e.name = tCommon('required');
    if (!values.categoryId) e.categoryId = tCommon('required');
    if (!values.providerId) e.providerId = tCommon('required');
    if (!values.inventoryId) e.inventoryId = tCommon('required');
    if (!hasVariants) {
      if (!values.costPrice || values.costPrice <= 0) e.costPrice = tCommon('required');
      if (!values.price || values.price <= 0) e.price = tCommon('required');
    }
    return e;
  }

  function validateVariantForm(): boolean {
    const e: { name?: string; costPrice?: string; price?: string } = {};
    if (!variantForm.name.trim()) e.name = tCommon('required');
    if (!variantForm.costPrice || Number(variantForm.costPrice) <= 0) e.costPrice = tCommon('required');
    if (!variantForm.price || Number(variantForm.price) <= 0) e.price = tCommon('required');
    setVariantErrors(e);
    return Object.keys(e).length === 0;
  }

  // ---------------------------------------------------------------------------
  // Submit — flush product fields + all pending variant ops
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setIsSubmitting(true);
    try {
      // 1. Save product fields
      const productResult = product
        ? await updateProductAction(product.id, {
            name: values.name,
            ...(hasVariants ? {} : { costPrice: values.costPrice, price: values.price }),
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

      if (!productResult.success) {
        toast.error(tCommon(getErrorKey(productResult.error)));
        return;
      }

      // 2. Flush pending variant ops (only for existing products)
      if (product && pendingOps.length > 0) {
        // Remap temp create ops to use real productId
        const ops = pendingOps.map((op) => op.type === 'create' ? { ...op, data: { ...op.data, productId: product.id } } : op);
        const variantResult = await syncVariantsAction(product.id, values.name, ops);
        if (!variantResult.success) {
          toast.error(tCommon(getErrorKey(variantResult.error)));
          return;
        }
      }

      toast.success(t('saveSuccess'));
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Local variant ops (no DB calls)
  // ---------------------------------------------------------------------------

  function startEditVariant(v: LocalVariant) {
    setEditingVariantId(v.id);
    setVariantForm({ name: v.name, costPrice: String(v.costPrice), price: String(v.price), unit: v.unit });
    setVariantErrors({});
  }

  function cancelVariantEdit() {
    setEditingVariantId(null);
    setVariantForm(emptyVariantForm());
    setVariantErrors({});
  }

  function handleAddVariant() {
    if (!validateVariantForm()) return;
    const tempId = nextTempId();
    const newVariant: LocalVariant = {
      id: tempId,
      name: variantForm.name,
      costPrice: Number(variantForm.costPrice),
      price: Number(variantForm.price),
      unit: variantForm.unit,
      stockQty: 0,
    };
    setLocalVariants((prev) => [...prev, newVariant]);
    setPendingOps((prev) => [...prev, {
      type: 'create',
      data: { productId: product?.id ?? 0, name: newVariant.name, costPrice: newVariant.costPrice, price: newVariant.price, unit: newVariant.unit || undefined },
    }]);
    setVariantForm(emptyVariantForm());
    setVariantErrors({});
  }

  function handleUpdateVariant() {
    if (!validateVariantForm() || editingVariantId === null) return;
    const id = editingVariantId;
    const updated: Partial<LocalVariant> = {
      name: variantForm.name,
      costPrice: Number(variantForm.costPrice),
      price: Number(variantForm.price),
      unit: variantForm.unit,
    };
    setLocalVariants((prev) => prev.map((v) => v.id === id ? { ...v, ...updated } : v));

    if (id < 0) {
      // Still a pending-create — update the create op instead of adding an update op
      setPendingOps((prev) => prev.map((op) =>
        op.type === 'create' && op.data.name === localVariants.find((v) => v.id === id)?.name
          ? { ...op, data: { ...op.data, name: updated.name!, costPrice: updated.costPrice!, price: updated.price!, unit: updated.unit || undefined } }
          : op
      ));
    } else {
      // Real DB record — add/replace update op
      setPendingOps((prev) => {
        const without = prev.filter((op) => !(op.type === 'update' && op.id === id));
        return [...without, { type: 'update', id, data: { name: updated.name!, costPrice: updated.costPrice!, price: updated.price!, unit: updated.unit || undefined } }];
      });
    }
    setEditingVariantId(null);
    setVariantForm(emptyVariantForm());
    setVariantErrors({});
  }

  function handleDeleteVariant(id: number) {
    setLocalVariants((prev) => prev.filter((v) => v.id !== id));
    if (id < 0) {
      // Was never saved — just remove the create op
      setPendingOps((prev) => prev.filter((op) => !(op.type === 'create' && localVariants.find((v) => v.id === id)?.name === op.data.name)));
    } else {
      // Real record — remove any prior update op and add a delete op
      setPendingOps((prev) => {
        const without = prev.filter((op) => !(op.type === 'update' && op.id === id));
        return [...without, { type: 'delete', id }];
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Drawer open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
        <DrawerContent
          className="max-h-[92dvh] min-h-[90dvh]"
          onAnimationEnd={(e) => {
            if ((e.currentTarget as HTMLElement).dataset.state === 'open') {
              setReady(true);
            }
          }}
        >
          <DrawerHeader>
            <DrawerTitle>{product ? t('editProduct') : t('addProduct')}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-4 space-y-4 py-2" inert={!ready || undefined}>
            <FormField label={t('form.name')} required error={errors.name} htmlFor={nameId}>
              <Input className='text-base' id={nameId} value={values.name} onChange={(e) => set('name', e.target.value)} placeholder={t('form.namePlaceholder')} aria-invalid={!!errors.name} onFocus={scrollOnFocus} />
            </FormField>
            <FormField label={t('form.category')} required error={errors.categoryId}>
              <MobileSelectSheet
                value={values.categoryId ? String(values.categoryId) : ''}
                onChange={(v) => set('categoryId', v ? Number(v) : 0)}
                options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                placeholder={t('form.categoryPlaceholder')}
                title={t('form.category')}
                aria-invalid={!!errors.categoryId}
              />
            </FormField>
            <FormField label={t('form.provider')} required error={errors.providerId}>
              <MobileSelectSheet
                value={values.providerId ? String(values.providerId) : ''}
                onChange={(v) => set('providerId', v ? Number(v) : 0)}
                options={providers.map((p) => ({ value: String(p.id), label: p.name }))}
                placeholder={t('form.providerPlaceholder')}
                title={t('form.provider')}
                aria-invalid={!!errors.providerId}
              />
            </FormField>
            <FormField label={t('form.inventory')} required error={errors.inventoryId}>
              <MobileSelectSheet
                value={values.inventoryId ? String(values.inventoryId) : ''}
                onChange={(v) => set('inventoryId', v ? Number(v) : 0)}
                options={inventories.map((inv) => ({ value: String(inv.id), label: inv.name }))}
                placeholder={t('form.inventoryPlaceholder')}
                title={t('form.inventory')}
                aria-invalid={!!errors.inventoryId}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t('form.costPrice')} required={!hasVariants} error={errors.costPrice} htmlFor={costId}>
                <PriceInput id={costId} value={values.costPrice || ''} onChange={(v: number) => set('costPrice', v)} aria-invalid={!!errors.costPrice} disabled={hasVariants} className={hasVariants ? 'opacity-50 cursor-not-allowed' : ''} onFocus={scrollOnFocus} />
                {hasVariants && <p className="text-xs text-muted-foreground mt-1">{t('variantPriceManagedByVariant')}</p>}
              </FormField>
              <FormField label={t('form.retailPrice')} required={!hasVariants} error={errors.price} htmlFor={priceId}>
                <PriceInput id={priceId} value={values.price || ''} onChange={(v) => set('price', v)} aria-invalid={!!errors.price} disabled={hasVariants} className={hasVariants ? 'opacity-50 cursor-not-allowed' : ''} onFocus={scrollOnFocus} />
              </FormField>
            </div>
            <FormField label="Đơn vị tính" htmlFor={unitId}>
              <Input id={unitId} value={values.unit} onChange={(e) => set('unit', e.target.value)} placeholder="Ví dụ: hộp, cái, kg..." onFocus={scrollOnFocus} />
            </FormField>
            <FormField label={t('form.description')} htmlFor={descId}>
              <Textarea id={descId} value={values.description} onChange={(e) => set('description', e.target.value)} placeholder={t('form.descriptionPlaceholder')} rows={3} onFocus={scrollOnFocus} />
            </FormField>

            {/* Variant section — only shown when editing an existing product */}
            {product && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{t('variantsTitle')}</p>
                  {hasPendingVariantChanges && (
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">● {t('variantUnsaved', { count: pendingOps.length })}</span>
                  )}
                </div>

                {/* Existing local variants */}
                {localVariants.map((v) =>
                  editingVariantId === v.id ? (
                    <div key={v.id} className="space-y-2 rounded-md border p-3 bg-muted/30">
                      <Input
                        placeholder={t('variantNamePlaceholder')}
                        value={variantForm.name}
                        onChange={(e) => { setVariantForm((f) => ({ ...f, name: e.target.value })); setVariantErrors((e) => ({ ...e, name: undefined })); }}
                        aria-invalid={!!variantErrors.name}
                      />
                      {variantErrors.name && <p className="text-xs text-destructive">{variantErrors.name}</p>}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <PriceInput placeholder={t('variantCostPricePlaceholder')} value={variantForm.costPrice} onChange={(v) => { setVariantForm((f) => ({ ...f, costPrice: String(v) })); setVariantErrors((e) => ({ ...e, costPrice: undefined })); }} aria-invalid={!!variantErrors.costPrice} />
                          {variantErrors.costPrice && <p className="text-xs text-destructive mt-0.5">{variantErrors.costPrice}</p>}
                        </div>
                        <div>
                          <PriceInput placeholder={t('variantPricePlaceholder')} value={variantForm.price} onChange={(v) => { setVariantForm((f) => ({ ...f, price: String(v) })); setVariantErrors((e) => ({ ...e, price: undefined })); }} aria-invalid={!!variantErrors.price} />
                          {variantErrors.price && <p className="text-xs text-destructive mt-0.5">{variantErrors.price}</p>}
                        </div>
                      </div>
                      <Input placeholder={t('variantUnitPlaceholder')} value={variantForm.unit} onChange={(e) => setVariantForm((f) => ({ ...f, unit: e.target.value }))} />
                      <div className="flex gap-2">
                        <Button size="sm" className="min-h-[44px]" onClick={handleUpdateVariant}>
                          <Check className="h-3 w-3" /> {t('variantSave')}
                        </Button>
                        <Button size="sm" variant="outline" className="min-h-[44px]" onClick={cancelVariantEdit}>
                          <X className="h-3 w-3" /> {t('variantCancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{v.name}</span>
                        {v.id < 0 && <span className="ml-1.5 text-xs text-amber-600">{t('variantNew')}</span>}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {v.costPrice.toLocaleString()} / {v.price.toLocaleString()}
                          {v.unit ? ` · ${v.unit}` : ''}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">Tồn: {v.stockQty}</span>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button size="icon" variant="ghost" className="h-10 w-10" onClick={() => startEditVariant(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" onClick={() => handleDeleteVariant(v.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                )}

                {/* Add new variant row */}
                {editingVariantId === null && (
                  <div className="space-y-2 rounded-md border border-dashed p-3">
                    <Input
                      placeholder={t('variantNamePlaceholder')}
                      value={variantForm.name}
                      onChange={(e) => { setVariantForm((f) => ({ ...f, name: e.target.value })); setVariantErrors((e) => ({ ...e, name: undefined })); }}
                      aria-invalid={!!variantErrors.name}
                    />
                    {variantErrors.name && <p className="text-xs text-destructive">{variantErrors.name}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <PriceInput placeholder={t('variantCostPricePlaceholder')} value={variantForm.costPrice} onChange={(v) => { setVariantForm((f) => ({ ...f, costPrice: String(v) })); setVariantErrors((e) => ({ ...e, costPrice: undefined })); }} aria-invalid={!!variantErrors.costPrice} />
                        {variantErrors.costPrice && <p className="text-xs text-destructive mt-0.5">{variantErrors.costPrice}</p>}
                      </div>
                      <div>
                        <PriceInput placeholder={t('variantPricePlaceholder')} value={variantForm.price} onChange={(v) => { setVariantForm((f) => ({ ...f, price: String(v) })); setVariantErrors((e) => ({ ...e, price: undefined })); }} aria-invalid={!!variantErrors.price} />
                        {variantErrors.price && <p className="text-xs text-destructive mt-0.5">{variantErrors.price}</p>}
                      </div>
                    </div>
                    <Input placeholder={t('variantUnitPlaceholder')} value={variantForm.unit} onChange={(e) => setVariantForm((f) => ({ ...f, unit: e.target.value }))} />
                    <Button size="sm" variant="outline" className="min-h-[44px]" onClick={handleAddVariant}>
                      <Plus className="h-3 w-3 mr-1" /> {t('variantAdd')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          </ScrollArea>
          <DrawerFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={requestClose} disabled={isSubmitting || !ready}>
              {tCommon('cancel')}
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting || !ready}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? tCommon('saving') : tCommon('save')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Discard warning dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('variantDiscardTitle')}</DialogTitle>
            <DialogDescription>
              {t('variantDiscardDesc', { count: pendingOps.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscardDialog(false)}>{t('variantDiscardContinue')}</Button>
            <Button variant="destructive" onClick={discardAndClose}>{t('variantDiscardConfirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
