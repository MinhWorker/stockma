'use client';

import { useTranslations } from 'next-intl';
import { FormField } from '@/components/forms/form-field';
import { cn, formatPrice } from '@/lib/utils';
import type { VariantSummary } from '@/services/types';

interface VariantChipSelectorProps {
  label: string;
  required?: boolean;
  variants: VariantSummary[];
  selectedId: number | undefined;
  onSelect: (id: number | undefined) => void;
  error?: string;
  getPrice: (v: VariantSummary) => number;
  disableOutOfStock?: boolean;
}

export function VariantChipSelector({
  label,
  required,
  variants,
  selectedId,
  onSelect,
  error,
  getPrice,
  disableOutOfStock,
}: VariantChipSelectorProps) {
  const tProducts = useTranslations('products');

  return (
    <FormField label={label} required={required} error={error}>
      <div className="flex flex-wrap gap-2 pt-1">
        {variants.map((v) => {
          const isActive = selectedId === v.id;
          const isDisabled = !!disableOutOfStock && v.stockQty <= 0;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                if (!isDisabled) onSelect(isActive ? undefined : v.id);
              }}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              className={cn(
                'flex flex-col items-start px-3 py-2 rounded-xl border transition-all text-left min-w-[92px]',
                isDisabled && 'cursor-not-allowed opacity-50',
                isActive
                  ? 'bg-primary/10 border-primary ring-1 ring-primary'
                  : 'bg-card border-border hover:border-muted-foreground/50'
              )}
            >
              <span className={cn(
                'text-xs font-semibold leading-none mb-1',
                isActive ? 'text-primary' : 'text-foreground'
              )}>
                {v.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatPrice(getPrice(v))}
              </span>
              <span className={cn(
                'mt-1 text-[10px] font-medium',
                v.stockQty > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              )}>
                {tProducts('variantStock')}: {v.stockQty}
              </span>
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
