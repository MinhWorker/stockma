'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { MobileSelectSheet } from '@/components/forms/mobile-select-sheet';
import { useScrollIntoViewOnFocus } from '@/hooks/use-scroll-into-view-on-focus';
import type { CategorySummary, ProviderSummary, InventorySummary } from '@/services/types';
import type { ProductFormValues, ProductFormErrors } from './product-form-types';

interface ProductBasicFieldsProps {
  values: ProductFormValues;
  errors: ProductFormErrors;
  categories: CategorySummary[];
  providers: ProviderSummary[];
  inventories: InventorySummary[];
  disabled: boolean;
  onChange: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void;
  onAddCategory: (name: string) => Promise<{ value: string; label: string } | null>;
  onAddProvider: (name: string) => Promise<{ value: string; label: string } | null>;
  onGoToSettings: () => void;
}

export function ProductBasicFields({
  values,
  errors,
  categories,
  providers,
  inventories,
  disabled,
  onChange,
  onAddCategory,
  onAddProvider,
  onGoToSettings,
}: ProductBasicFieldsProps) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const tCat = useTranslations('categories');
  const tProv = useTranslations('providers');
  const { onFocus: scrollOnFocus } = useScrollIntoViewOnFocus();

  const nameId = useId();
  const descId = useId();

  return (
    <div className="space-y-4">
      <FormField label={t('form.name')} required error={errors.name} htmlFor={nameId}>
        <Input
          id={nameId}
          className="text-base"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder={t('form.namePlaceholder')}
          aria-invalid={!!errors.name}
          onFocus={scrollOnFocus}
          disabled={disabled}
        />
      </FormField>

      <FormField label={t('form.category')} required error={errors.categoryId}>
        <MobileSelectSheet
          value={values.categoryId ? String(values.categoryId) : ''}
          onChange={(v) => onChange('categoryId', v ? Number(v) : 0)}
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          placeholder={t('form.categoryPlaceholder')}
          title={t('form.category')}
          aria-invalid={!!errors.categoryId}
          disabled={disabled}
          onAddNew={onAddCategory}
          addNewLabel={tCat('addCategory')}
          addNewPlaceholder={tCat('form.namePlaceholder')}
        />
      </FormField>

      <FormField label={t('form.provider')} required error={errors.providerId}>
        <MobileSelectSheet
          value={values.providerId ? String(values.providerId) : ''}
          onChange={(v) => onChange('providerId', v ? Number(v) : 0)}
          options={providers.map((p) => ({ value: String(p.id), label: p.name }))}
          placeholder={t('form.providerPlaceholder')}
          title={t('form.provider')}
          aria-invalid={!!errors.providerId}
          disabled={disabled}
          onAddNew={onAddProvider}
          addNewLabel={tProv('addProvider')}
          addNewPlaceholder={tProv('form.namePlaceholder')}
        />
      </FormField>

      <FormField label={t('form.inventory')} required error={errors.inventoryId}>
        <MobileSelectSheet
          value={values.inventoryId ? String(values.inventoryId) : ''}
          onChange={(v) => onChange('inventoryId', v ? Number(v) : 0)}
          options={inventories.map((inv) => ({ value: String(inv.id), label: inv.name }))}
          placeholder={t('form.inventoryPlaceholder')}
          title={t('form.inventory')}
          aria-invalid={!!errors.inventoryId}
          disabled={disabled}
          onNavigate={onGoToSettings}
          navigateLabel={t('goToSettingsLabel')}
          navigateConfirmTitle={t('goToSettingsTitle')}
          navigateConfirmDesc={t('goToSettingsDesc')}
          navigateConfirmAction={t('goToSettingsConfirm')}
          navigateCancelLabel={tCommon('cancel')}
        />
      </FormField>

      <FormField label={t('form.description')} htmlFor={descId}>
        <Textarea
          id={descId}
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder={t('form.descriptionPlaceholder')}
          rows={3}
          onFocus={scrollOnFocus}
          disabled={disabled}
        />
      </FormField>
    </div>
  );
}
