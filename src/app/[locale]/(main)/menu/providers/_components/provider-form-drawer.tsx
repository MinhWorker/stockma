'use client';

import { useEffect, useId, useState } from 'react';
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
import { FormField } from '@/components/forms/form-field';
import { createProviderAction, updateProviderAction } from '@/actions/providers.action';
import { getErrorKey } from '@/lib/error-message';
import type { ProviderSummary } from '@/services/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: ProviderSummary;
  onSuccess: () => void;
}

export function ProviderFormDrawer({ open, onOpenChange, provider, onSuccess }: Props) {
  const t = useTranslations('providers');
  const tCommon = useTranslations('common');
  const nameId = useId();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(provider?.name ?? '');
      setNameError('');
    }
  }, [open, provider]);

  async function handleSubmit() {
    if (!name.trim()) {
      setNameError(tCommon('required'));
      return;
    }
    setIsSubmitting(true);
    try {
      const result = provider
        ? await updateProviderAction(provider.id, { name: name.trim() })
        : await createProviderAction({ name: name.trim() });
      if (!result.success) {
        toast.error(tCommon(getErrorKey(result.error)));
        return;
      }
      toast.success(t('saveSuccess'));
      onOpenChange(false);
      onSuccess();
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
          <DrawerTitle>{provider ? t('editProvider') : t('addProvider')}</DrawerTitle>
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
