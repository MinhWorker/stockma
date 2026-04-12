'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PriceInput } from '@/components/forms/price-input';
import type { VariantDraft, VariantDraftErrors } from './product-form-types';

interface VariantDraftRowProps {
  draft: VariantDraft;
  index: number;
  errors?: VariantDraftErrors;
  disabled: boolean;
  onChange: (field: keyof Omit<VariantDraft, 'id' | 'stockQty'>, value: string) => void;
  onRemove: () => void;
}

export function VariantDraftRow({
  draft,
  index,
  errors,
  disabled,
  onChange,
  onRemove,
}: VariantDraftRowProps) {
  const t = useTranslations('products');

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t('variantIndex', { index: index + 1 })}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
          disabled={disabled}
          aria-label={t('variantRemove')}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Name */}
      <div>
        <Input
          placeholder={t('variantNamePlaceholder')}
          value={draft.name}
          onChange={(e) => onChange('name', e.target.value)}
          aria-invalid={!!errors?.name}
          disabled={disabled}
        />
        {errors?.name && (
          <p className="text-xs text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <PriceInput
            placeholder={t('variantCostPricePlaceholder')}
            value={draft.costPrice}
            onChange={(v) => onChange('costPrice', String(v))}
            aria-invalid={!!errors?.costPrice}
            disabled={disabled}
          />
          {errors?.costPrice && (
            <p className="text-xs text-destructive mt-1">{errors.costPrice}</p>
          )}
        </div>
        <div>
          <PriceInput
            placeholder={t('variantPricePlaceholder')}
            value={draft.price}
            onChange={(v) => onChange('price', String(v))}
            aria-invalid={!!errors?.price}
            disabled={disabled}
          />
          {errors?.price && (
            <p className="text-xs text-destructive mt-1">{errors.price}</p>
          )}
        </div>
      </div>

      {/* Unit */}
      <Input
        placeholder={t('variantUnitPlaceholder')}
        value={draft.unit}
        onChange={(e) => onChange('unit', e.target.value)}
        disabled={disabled}
      />

      {/* Stock badge for existing variants */}
      {draft.stockQty !== undefined && (
        <p className="text-xs text-muted-foreground">
          {t('variantStock')}: <span className="font-medium">{draft.stockQty}</span>
        </p>
      )}
    </div>
  );
}
