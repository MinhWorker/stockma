'use client';

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
}

export function VariantChipSelector({
  label,
  required,
  variants,
  selectedId,
  onSelect,
  error,
  getPrice,
}: VariantChipSelectorProps) {
  return (
    <FormField label={label} required={required} error={error}>
      <div className="flex flex-wrap gap-2 pt-1">
        {variants.map((v) => {
          const isActive = selectedId === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(isActive ? undefined : v.id)}
              className={cn(
                'flex flex-col items-start px-3 py-2 rounded-xl border transition-all text-left min-w-[80px]',
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
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
