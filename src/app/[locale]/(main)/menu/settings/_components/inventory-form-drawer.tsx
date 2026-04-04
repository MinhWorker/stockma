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
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { createInventoryAction, updateInventoryAction } from '@/actions/inventory-setup.action';
import { getErrorKey } from '@/lib/error-message';
import type { InventorySummary } from '@/services/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory?: InventorySummary;
  onSuccess: () => void;
}

export function InventoryFormDrawer({ open, onOpenChange, inventory, onSuccess }: Props) {
  const t = useTranslations('inventorySetup');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [, startTransition] = useTransition();
  const nameId = useId();
  const descId = useId();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(inventory?.name ?? '');
      setDescription(inventory?.description ?? '');
      setNameError('');
    }
  }, [open, inventory]);

  async function handleSubmit() {
    if (!name.trim()) { setNameError(tCommon('required')); return; }
    setIsSubmitting(true);
    try {
      const result = inventory
        ? await updateInventoryAction(inventory.id, { name: name.trim(), description: description.trim() || undefined })
        : await createInventoryAction({ name: name.trim(), description: description.trim() || undefined });
      if (!result.success) { toast.error(tCommon(getErrorKey(result.error))); return; }
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
      <DrawerContent className="max-h-[65vh]">
        <DrawerHeader>
          <DrawerTitle>{inventory ? t('editInventory') : t('addInventory')}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 space-y-4 pb-2">
          <FormField label={t('form.name')} required error={nameError} htmlFor={nameId}>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              placeholder={t('form.namePlaceholder')}
              aria-invalid={!!nameError}
            />
          </FormField>
          <FormField label={t('form.description')} htmlFor={descId}>
            <Textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
              rows={3}
            />
          </FormField>
        </div>
        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
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
