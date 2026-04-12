'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { VariantDraftRow } from './variant-draft-row';
import type { VariantDraft, VariantDraftErrors } from './product-form-types';

interface ProductVariantsSectionProps {
  /** Whether this is an existing product (edit mode) */
  isEditing: boolean;
  variantModeEnabled: boolean;
  drafts: VariantDraft[];
  draftErrors: Record<number, VariantDraftErrors>;
  disabled: boolean;
  onToggleVariantMode: (enabled: boolean) => void;
  onAddRow: () => void;
  onRemoveRow: (id: number) => void;
  onChangeRow: (id: number, field: keyof Omit<VariantDraft, 'id' | 'stockQty'>, value: string) => void;
}

export function ProductVariantsSection({
  isEditing,
  variantModeEnabled,
  drafts,
  draftErrors,
  disabled,
  onToggleVariantMode,
  onAddRow,
  onRemoveRow,
  onChangeRow,
}: ProductVariantsSectionProps) {
  const t = useTranslations('products');

  const showVariantRows = isEditing || variantModeEnabled;

  return (
    <div className="space-y-3 pt-4 border-t border-border">
      {/* Toggle checkbox — only for new products */}
      {!isEditing && (
        <label className="flex items-center gap-3 cursor-pointer py-1 min-h-[44px]">
          <Checkbox
            checked={variantModeEnabled}
            onCheckedChange={(checked) => onToggleVariantMode(checked === true)}
            disabled={disabled}
          />
          <div>
            <p className="text-sm font-medium leading-none">{t('hasVariants')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('hasVariantsHint')}</p>
          </div>
        </label>
      )}

      {/* Variant rows */}
      {showVariantRows && (
        <div className="space-y-3">
          {isEditing && (
            <p className="text-sm font-semibold">{t('variantsTitle')}</p>
          )}

          {drafts.map((d, idx) => (
            <VariantDraftRow
              key={d.id}
              draft={d}
              index={idx}
              errors={draftErrors[d.id]}
              disabled={disabled}
              onChange={(field, value) => onChangeRow(d.id, field, value)}
              onRemove={() => onRemoveRow(d.id)}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full min-h-[44px] border-dashed"
            onClick={onAddRow}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('variantAdd')}
          </Button>
        </div>
      )}
    </div>
  );
}
