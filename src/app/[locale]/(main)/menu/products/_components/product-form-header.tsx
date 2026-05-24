'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface ProductFormHeaderProps {
  isEditing: boolean;
  isSubmitting: boolean;
  canSave?: boolean;
  onSave: () => void;
}

export function ProductFormHeader({ isEditing, isSubmitting, canSave = true, onSave }: ProductFormHeaderProps) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <h1 className="text-base font-semibold">
        {isEditing ? t('editProduct') : t('addProduct')}
      </h1>
      <Button
        size="sm"
        className="min-h-[36px] min-w-[72px]"
        onClick={onSave}
        disabled={isSubmitting || !canSave}
      >
        {isSubmitting
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : tCommon('save')}
      </Button>
    </div>
  );
}
