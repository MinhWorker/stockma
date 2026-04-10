'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MobileSearchBar } from '@/components/forms/mobile-search-bar';
import { deleteProviderAction } from '@/actions/providers.action';
import { getErrorKey } from '@/lib/error-message';
import { useDebouncedUrlParam } from '@/hooks/use-debounced-url-param';
import { normalizeSearchText } from '@/lib/normalize-search';
import { ProviderCard } from './provider-card';
import { ProviderFormDrawer } from './provider-form-drawer';
import { Fab } from '../../inventory/_components/fab';
import type { ProviderSummary } from '@/services/types';

interface Props {
  initialData: ProviderSummary[];
}

export function MobileProvidersClient({ initialData }: Props) {
  const t = useTranslations('providers');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [data, setData] = useState<ProviderSummary[]>(initialData);
  useEffect(() => { setData(initialData); }, [initialData]);

  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);

  const [inputValue, setInputValue, search] = useDebouncedUrlParam('q', 300, normalizeSearchText);
  const [selected, setSelected] = useState<ProviderSummary | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderSummary | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(
    () => !search ? data : data.filter((p) => normalizeSearchText(p.name).includes(search)),
    [data, search]
  );

  const handleSelect = useCallback((provider: ProviderSummary) => { setSelected(provider); setDetailOpen(true); }, []);
  const handleOpenAdd = useCallback(() => { setEditing(undefined); setFormOpen(true); }, []);
  const handleEdit = useCallback((provider: ProviderSummary) => { setDetailOpen(false); setEditing(provider); setFormOpen(true); }, []);

  const handleDelete = useCallback(async (provider: ProviderSummary) => {
    if (provider.totalProducts > 0) { toast.error(t('deleteError')); return; }
    setIsDeleting(true);
    try {
      const result = await deleteProviderAction(provider.id);
      if (!result.success) { toast.error(tCommon(getErrorKey(result.error))); return; }
      toast.success(t('deleteSuccess'));
      setDetailOpen(false);
      refresh();
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsDeleting(false);
    }
  }, [t, tCommon, refresh]);

  return (
    <>
      <MobileSearchBar value={inputValue} onChange={setInputValue} placeholder={t('searchPlaceholder')} clearLabel={tCommon('clearSearch')} />

      <p className="px-4 pb-1 text-xs text-muted-foreground">{filtered.length} {t('countLabel')}</p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Truck className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{search ? t('emptyFilterTitle') : t('emptyTitle')}</p>
            <p className="text-sm text-muted-foreground">{search ? t('emptyFilterDesc') : t('emptyDesc')}</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} onClick={() => handleSelect(provider)} />
          ))}
        </div>
      )}

      <Fab onClick={handleOpenAdd} label={t('addProvider')} />

      <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
        <DrawerContent className="max-h-[50vh]">
          <DrawerHeader><DrawerTitle>{selected?.name}</DrawerTitle></DrawerHeader>
          {selected && (
            <div className="px-4 divide-y divide-border/60">
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">{t('columns.products')}</span>
                <span className="font-medium">{selected.totalProducts}</span>
              </div>
            </div>
          )}
          <Separator className="mt-2" />
          <DrawerFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDetailOpen(false)}>{tCommon('close')}</Button>
            <Button variant="outline" className="flex-1" onClick={() => selected && handleEdit(selected)}>{tCommon('edit')}</Button>
            <Button variant="destructive" className="flex-1" onClick={() => selected && handleDelete(selected)} disabled={isDeleting}>{tCommon('delete')}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ProviderFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        provider={editing}
        onSuccess={() => { setFormOpen(false); refresh(); }}
      />
    </>
  );
}
