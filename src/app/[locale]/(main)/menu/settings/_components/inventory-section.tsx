'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Warehouse } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SettingsSection } from './settings-section';
import { InventoryFormDrawer } from './inventory-form-drawer';
import { deleteInventoryAction } from '@/actions/inventory-setup.action';
import { getErrorKey } from '@/lib/error-message';
import type { InventorySummary } from '@/services/types';

interface Props {
  initialInventories: InventorySummary[];
}

export function InventorySection({ initialInventories }: Props) {
  const t = useTranslations('inventorySetup');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventorySummary | undefined>();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleEdit = useCallback((inv: InventorySummary) => {
    setEditing(inv);
    setFormOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditing(undefined);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (inv: InventorySummary) => {
    if (inv.totalProducts > 0) {
      toast.error(t('deleteError'));
      return;
    }
    setDeletingId(inv.id);
    try {
      const result = await deleteInventoryAction(inv.id);
      if (!result.success) toast.error(tCommon(getErrorKey(result.error)));
      else { toast.success(t('deleteSuccess')); startTransition(() => router.refresh()); }
    } finally {
      setDeletingId(null);
    }
  }, [t, router]);

  return (
    <>
      <SettingsSection title={t('title')}>
        {initialInventories.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center px-4">
            <Warehouse className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">{t('emptyDesc')}</p>
          </div>
        ) : (
          initialInventories.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{inv.name}</p>
                {inv.description && (
                  <p className="text-xs text-muted-foreground truncate">{inv.description}</p>
                )}
                <p className="text-xs text-muted-foreground">{inv.totalProducts} {t('products')}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" aria-label={tCommon('edit')} onClick={() => handleEdit(inv)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={tCommon('delete')}
                  onClick={() => handleDelete(inv)}
                  disabled={deletingId === inv.id}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </SettingsSection>

      <div className="px-4">
        <Button variant="outline" className="w-full" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('addInventory')}
        </Button>
      </div>

      <InventoryFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        inventory={editing}
        onSuccess={() => setFormOpen(false)}
      />
    </>
  );
}
