'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  createProductAction,
  updateProductAction,
  getProductFormDataAction,
  syncVariantsAction,
} from '@/actions/products.action';
import type { VariantPendingOp } from '@/actions/products.action';
import { createCategoryAction } from '@/actions/categories.action';
import { createProviderAction } from '@/actions/providers.action';
import { getErrorKey } from '@/lib/error-message';
import { useWithLoading } from '@/components/feedback/loading-overlay';
import { useFormDraft } from '@/hooks/use-form-draft';
import type {
  ProductSummary,
  CategorySummary,
  ProviderSummary,
  InventorySummary,
  VariantSummary,
} from '@/services/types';
import type { ProductFormValues, ProductFormErrors, VariantDraft, VariantDraftErrors } from './product-form-types';
import { ProductFormHeader } from './product-form-header';
import { ProductBasicFields } from './product-basic-fields';
import { ProductPricingFields } from './product-pricing-fields';
import { ProductVariantsSection } from './product-variants-section';

// ---------------------------------------------------------------------------
// Draft persistence (survives navigation to settings and back)
// ---------------------------------------------------------------------------

interface FormDraft {
  values: ProductFormValues;
  variantDrafts: VariantDraft[];
  variantModeEnabled: boolean;
}

function draftKey(productId: number | undefined) {
  return `product-form-draft:${productId ?? 'new'}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tempIdCounter = -1;
function nextTempId() { return tempIdCounter--; }

function emptyValues(): ProductFormValues {
  return { name: '', costPrice: 0, price: 0, categoryId: 0, providerId: 0, inventoryId: 0, description: '', unit: '' };
}

function valuesFromProduct(p: ProductSummary): ProductFormValues {
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

function draftFromVariant(v: VariantSummary): VariantDraft {
  return {
    id: v.id,
    name: v.name,
    costPrice: String(v.costPrice ?? v.effectiveCostPrice),
    price: String(v.price ?? v.effectivePrice),
    unit: v.unit ?? '',
    stockQty: v.stockQty,
  };
}

function emptyDraft(): VariantDraft {
  return { id: nextTempId(), name: '', costPrice: '', price: '', unit: '' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  product?: ProductSummary;
}

export function ProductFormPage({ product }: Props) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const withLoading = useWithLoading();

  // Form state
  const [values, setValues] = useState<ProductFormValues>(
    () => product ? valuesFromProduct(product) : emptyValues()
  );
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference data
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [inventories, setInventories] = useState<InventorySummary[]>([]);

  // Variant state
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>(
    () => product?.variants.map(draftFromVariant) ?? []
  );
  const [variantDraftErrors, setVariantDraftErrors] = useState<Record<number, VariantDraftErrors>>({});
  const [variantModeEnabled, setVariantModeEnabled] = useState(false);

  const isEditing = !!product;
  const variantMode = isEditing ? variantDrafts.length > 0 || variantModeEnabled : variantModeEnabled;

  // Restore draft if user navigated back from settings
  const { save: saveDraft } = useFormDraft<FormDraft>(
    draftKey(product?.id),
    (draft) => {
      setValues(draft.values);
      setVariantDrafts(draft.variantDrafts);
      setVariantModeEnabled(draft.variantModeEnabled);
    }
  );

  useEffect(() => {
    getProductFormDataAction().then(({ categories, providers, inventories }) => {
      setCategories(categories);
      setProviders(providers);
      setInventories(inventories);
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Field change
  // ---------------------------------------------------------------------------

  function handleFieldChange<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ---------------------------------------------------------------------------
  // Inline add category / provider
  // ---------------------------------------------------------------------------

  async function handleAddCategory(name: string) {
    const result = await createCategoryAction({ name });
    if (!result.success || !result.data) return null;
    setCategories((prev) => [...prev, result.data!]);
    handleFieldChange('categoryId', result.data.id);
    return { value: String(result.data.id), label: result.data.name };
  }

  async function handleAddProvider(name: string) {
    const result = await createProviderAction({ name });
    if (!result.success || !result.data) return null;
    setProviders((prev) => [...prev, result.data!]);
    handleFieldChange('providerId', result.data.id);
    return { value: String(result.data.id), label: result.data.name };
  }

  function handleGoToSettings() {
    saveDraft({ values, variantDrafts, variantModeEnabled });
    router.push(
      `/menu/settings?back=${encodeURIComponent(pathname)}` as Parameters<typeof router.push>[0]
    );
  }

  // ---------------------------------------------------------------------------
  // Variant mode toggle
  // ---------------------------------------------------------------------------

  function handleToggleVariantMode(enabled: boolean) {
    setVariantModeEnabled(enabled);
    if (enabled) {
      handleFieldChange('costPrice', 0);
      handleFieldChange('price', 0);
      handleFieldChange('unit', '');
      setVariantDrafts([emptyDraft()]);
    } else {
      setVariantDrafts([]);
      setVariantDraftErrors({});
    }
  }

  // ---------------------------------------------------------------------------
  // Variant draft ops
  // ---------------------------------------------------------------------------

  function handleAddVariantRow() {
    setVariantDrafts((prev) => [...prev, emptyDraft()]);
  }

  function handleRemoveVariantRow(id: number) {
    setVariantDrafts((prev) => prev.filter((d) => d.id !== id));
    setVariantDraftErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleChangeVariantRow(
    id: number,
    field: keyof Omit<VariantDraft, 'id' | 'stockQty'>,
    value: string
  ) {
    setVariantDrafts((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
    setVariantDraftErrors((prev) => {
      if (!prev[id]?.[field as keyof VariantDraftErrors]) return prev;
      return { ...prev, [id]: { ...prev[id], [field]: undefined } };
    });
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validate(): ProductFormErrors {
    const e: ProductFormErrors = {};
    if (!values.name.trim()) e.name = tCommon('required');
    if (!values.categoryId) e.categoryId = tCommon('required');
    if (!values.providerId) e.providerId = tCommon('required');
    if (!values.inventoryId) e.inventoryId = tCommon('required');
    if (!variantMode) {
      if (!values.costPrice || values.costPrice <= 0) e.costPrice = tCommon('required');
      if (!values.price || values.price <= 0) e.price = tCommon('required');
    }
    return e;
  }

  function validateVariantDrafts(): boolean {
    const allErrors: Record<number, VariantDraftErrors> = {};
    for (const d of variantDrafts) {
      const e: VariantDraftErrors = {};
      if (!d.name.trim()) e.name = tCommon('required');
      if (!d.costPrice || Number(d.costPrice) <= 0) e.costPrice = tCommon('required');
      if (!d.price || Number(d.price) <= 0) e.price = tCommon('required');
      if (Object.keys(e).length) allErrors[d.id] = e;
    }
    setVariantDraftErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit() {
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }
    if (variantMode && variantDrafts.length === 0) {
      toast.error(t('variantRequiredWhenMode'));
      return;
    }
    if (variantMode && !validateVariantDrafts()) return;

    setIsSubmitting(true);
    await withLoading(async () => {
      try {
        const pendingOps = buildVariantOps();

        const productResult = isEditing
          ? await updateProductAction(product.id, {
              name: values.name,
              ...(!variantMode ? { costPrice: values.costPrice, price: values.price, unit: values.unit || undefined } : {}),
              categoryId: values.categoryId,
              providerId: values.providerId,
              inventoryId: values.inventoryId,
              shortDescription: values.description,
            })
          : await createProductAction({
              name: values.name,
              costPrice: variantMode ? 0 : values.costPrice,
              price: variantMode ? 0 : values.price,
              categoryId: values.categoryId,
              providerId: values.providerId,
              inventoryId: values.inventoryId,
              shortDescription: values.description,
              unit: variantMode ? undefined : (values.unit || undefined),
            });

        if (!productResult.success) {
          toast.error(tCommon(getErrorKey(productResult.error)));
          return;
        }

        if (pendingOps.length > 0) {
          const targetId = product?.id ?? productResult.data;
          if (!targetId) {
            toast.error(tCommon('error'));
            console.error('[ProductFormPage.handleSubmit] missing targetId after create');
            return;
          }
          const ops = pendingOps.map((op) =>
            op.type === 'create' ? { ...op, data: { ...op.data, productId: targetId } } : op
          );
          const variantResult = await syncVariantsAction(targetId, values.name, ops);
          if (!variantResult.success) {
            toast.error(tCommon(getErrorKey(variantResult.error)));
            return;
          }
        }

        toast.success(t('saveSuccess'));
        if (isEditing) {
          router.back();
        } else {
          router.push('/menu/products');
        }
      } catch (err) {
        toast.error(tCommon('error'));
        console.error('[ProductFormPage.handleSubmit]', err);
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  function buildVariantOps(): VariantPendingOp[] {
    const ops: VariantPendingOp[] = [];
    const originalIds = new Set((product?.variants ?? []).map((v) => v.id));
    const draftIds = new Set(variantDrafts.filter((d) => d.id > 0).map((d) => d.id));

    // Deleted variants
    for (const id of originalIds) {
      if (!draftIds.has(id)) ops.push({ type: 'delete', id });
    }

    for (const d of variantDrafts) {
      const data = {
        productId: product?.id ?? 0,
        name: d.name,
        costPrice: Number(d.costPrice),
        price: Number(d.price),
        unit: d.unit || undefined,
      };
      if (d.id < 0) {
        ops.push({ type: 'create', data });
      } else {
        const orig = product?.variants.find((v) => v.id === d.id);
        const origCost = orig ? (orig.costPrice ?? orig.effectiveCostPrice) : null;
        const origPrice = orig ? (orig.price ?? orig.effectivePrice) : null;
        const changed =
          orig &&
          (orig.name !== d.name ||
            origCost !== Number(d.costPrice) ||
            origPrice !== Number(d.price) ||
            (orig.unit ?? '') !== d.unit);
        if (changed) {
          ops.push({ type: 'update', id: d.id, data: { name: d.name, costPrice: Number(d.costPrice), price: Number(d.price), unit: d.unit || undefined } });
        }
      }
    }

    return ops;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Sticky sub-header — sticks within the scrolling <main> */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <ProductFormHeader
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          onSave={handleSubmit}
        />
      </div>

      {/* Form body */}
      <div className="px-4 py-5 space-y-6 pb-10" aria-disabled={isSubmitting || undefined}>

        {/* Basic info */}
        <ProductBasicFields
          values={values}
          errors={errors}
          categories={categories}
          providers={providers}
          inventories={inventories}
          disabled={isSubmitting}
          onChange={handleFieldChange}
          onAddCategory={handleAddCategory}
          onAddProvider={handleAddProvider}
          onGoToSettings={handleGoToSettings}
        />

        {/* Pricing — hidden when variant mode is on */}
        {!variantMode && (
          <ProductPricingFields
            values={values}
            errors={errors}
            disabled={isSubmitting}
            onChange={handleFieldChange}
          />
        )}

        {/* Variants */}
        <ProductVariantsSection
          isEditing={isEditing}
          variantModeEnabled={variantModeEnabled}
          drafts={variantDrafts}
          draftErrors={variantDraftErrors}
          disabled={isSubmitting}
          onToggleVariantMode={handleToggleVariantMode}
          onAddRow={handleAddVariantRow}
          onRemoveRow={handleRemoveVariantRow}
          onChangeRow={handleChangeVariantRow}
        />
      </div>
    </>
  );
}
