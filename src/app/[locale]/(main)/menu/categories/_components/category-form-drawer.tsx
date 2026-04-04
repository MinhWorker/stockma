'use client';

import { useEffect, useId, useTransition, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/forms/form-field';
import { createCategoryAction, updateCategoryAction } from '@/actions/categories.action';
import { getErrorKey } from '@/lib/error-message';
import type { CategorySummary } from '@/services/types';

const STATES = ['active', 'inactive'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategorySummary;
  onSuccess: () => void;
}

export function CategoryFormDrawer({ open, onOpenChange, category, onSuccess }: Props) {
  const t = useTranslations('categories');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [, startTransition] = useTransition();
  const nameId = useId();

  const [name, setName] = useState('');
  const [state, setState] = useState('active');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setState(category?.state ?? 'active');
      setNameError('');
    }
  }, [open, category]);

  async function handleSubmit() {
    if (!name.trim()) {
      setNameError(tCommon('required'));
      return;
    }
    setIsSubmitting(true);
    try {
      const result = category
        ? await updateCategoryAction(category.id, { name: name.trim(), state })
        : await createCategoryAction({ name: name.trim(), state });
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[60vh]">
        <DrawerHeader>
          <DrawerTitle>{category ? t('editCategory') : t('addCategory')}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 space-y-4 pb-2">
          <FormField label={t('form.name')} required error={nameError} htmlFor={nameId}>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              placeholder={t('form.namePlaceholder')}
              aria-invalid={!!nameError}
            />
          </FormField>
          <FormField label={t('form.state')} required>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('form.statePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
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
