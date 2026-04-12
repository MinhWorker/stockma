'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { PriceInput } from '@/components/forms/price-input';
import { FormField } from '@/components/forms/form-field';
import { useScrollIntoViewOnFocus } from '@/hooks/use-scroll-into-view-on-focus';
import type { ProductFormValues, ProductFormErrors } from './product-form-types';

interface ProductPricingFieldsProps {
  values: ProductFormValues;
  errors: ProductFormErrors;
  disabled: boolean;
  onChange: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void;
}

export function ProductPricingFields({
  values,
  errors,
  disabled,
  onChange,
}: ProductPricingFieldsProps) {
  const t = useTranslations('products');
  const { onFocus: scrollOnFocus } = useScrollIntoViewOnFocus();

  const costId = useId();
  const priceId = useId();
  const unitId = useId();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('form.costPrice')} required error={errors.costPrice} htmlFor={costId}>
          <PriceInput
            id={costId}
            value={values.costPrice || ''}
            onChange={(v) => onChange('costPrice', v)}
            aria-invalid={!!errors.costPrice}
            onFocus={scrollOnFocus}
            disabled={disabled}
          />
        </FormField>
        <FormField label={t('form.retailPrice')} required error={errors.price} htmlFor={priceId}>
          <PriceInput
            id={priceId}
            value={values.price || ''}
            onChange={(v) => onChange('price', v)}
            aria-invalid={!!errors.price}
            onFocus={scrollOnFocus}
            disabled={disabled}
          />
        </FormField>
      </div>

      <FormField label="Đơn vị tính" htmlFor={unitId}>
        <Input
          id={unitId}
          value={values.unit}
          onChange={(e) => onChange('unit', e.target.value)}
          placeholder="Ví dụ: hộp, cái, kg..."
          onFocus={scrollOnFocus}
          disabled={disabled}
        />
      </FormField>
    </div>
  );
}
