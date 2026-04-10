'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { Tag } from 'lucide-react';
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
import { deleteCategoryAction } from '@/actions/categories.action';
import { getErrorKey } from '@/lib/error-message';
import { useDebouncedUrlParam } from '@/hooks/use-debounced-url-param';
import { normalizeSearchText } from '@/lib/normalize-search';
import { CategoryCard } from './category-card';
import { CategoryFormDrawer } from './category-form-drawer';
import { Fab } from '../../inventory/_components/fab';
import type { CategorySummary } from '@/services/types';

interface Props {
  initialData: CategorySummary[];
}

export function MobileCategoriesClient({ initialData }: Props) {
  const t = useTranslations('categories');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [data, setData] = useState<CategorySummary[]>(initialData);
  useEffect(() => { setData(initialData); }, [initialData]);

  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);

  const [inputValue, setInputValue, search] = useDebouncedUrlParam('q', 300, normalizeSearchText);
  const [selected, setSelected] = useState<CategorySummary | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategorySummary | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(
    () => !search ? data : data.filter((c) => normalizeSearchText(c.name).includes(search)),
    [data, search]
  );

  const handleSelect = useCallback((category: CategorySummary) => { setSelected(category); setDetailOpen(true); }, []);
  const handleOpenAdd = useCallback(() => { setEditing(undefined); setFormOpen(true); }, []);
  const handleEdit = useCallback((category: CategorySummary) => { setDetailOpen(false); setEditing(category); setFormOpen(true); }, []);

  const handleDelete = useCallback(async (category: CategorySummary) => {
    if (category.totalProducts > 0) { toast.error(t('deleteError')); return; }
    setIsDeleting(true);
    try {
      const result = await deleteCategoryAction(category.id);
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

      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('countLabel', { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Tag className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{search ? t('emptyFilterTitle') : t('emptyTitle')}</p>
            <p className="text-sm text-muted-foreground">{search ? t('emptyFilterDesc') : t('emptyDesc')}</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((category) => (
            <CategoryCard key={category.id} category={category} onClick={() => handleSelect(category)} />
          ))}
        </div>
      )}

      <Fab onClick={handleOpenAdd} label={t('addCategory')} />

      <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
        <DrawerContent className="max-h-[50vh]">
          <DrawerHeader><DrawerTitle>{selected?.name}</DrawerTitle></DrawerHeader>
          {selected && (
            <div className="px-4 divide-y divide-border/60">
              <div className="flex justify-between py-3 text-sm">
                <span className="text-muted-foreground">{t('columns.state')}</span>
                <span className="font-medium">{selected.state}</span>
              </div>
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

      <CategoryFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSuccess={() => { setFormOpen(false); refresh(); }}
      />
    </>
  );
}
