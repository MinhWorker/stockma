'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/forms/form-field';
import { StatusBadge } from '@/components/data-display/status-badge';
import { createTransactionCorrectionAction } from '@/actions/inventory.action';
import { useSession } from '@/lib/auth-client';
import { getErrorKey } from '@/lib/error-message';
import type { TransactionRecord } from '@/services/types';
import { formatDateTime, formatPrice } from '@/lib/utils';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{children}</span>
    </div>
  );
}

interface Props {
  transaction: TransactionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDrawer({ transaction: tx, open, onOpenChange }: Props) {
  const t = useTranslations('transactions.detail');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { data: session } = useSession();
  const [dialogMode, setDialogMode] = useState<'quantity_edit' | 'cancellation' | null>(null);
  const [correctedQuantity, setCorrectedQuantity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stockOutTypeLabel = tx?.stockOutType
    ? t(`stockOutTypes.${tx.stockOutType}` as Parameters<typeof t>[0])
    : null;
  const correctionTypeLabel = tx?.correctionType
    ? t(`correctionTypes.${tx.correctionType}` as Parameters<typeof t>[0])
    : null;
  const canCreateCorrection = !!tx && !tx.correctionType;

  useEffect(() => {
    if (!tx) return;
    setDialogMode(null);
    setCorrectedQuantity(Math.abs(tx.quantity).toString());
    setNote('');
    setError('');
  }, [tx]);

  async function handleSubmitCorrection() {
    if (!tx || !dialogMode) return;

    const quantityValue = Number(correctedQuantity);
    if (dialogMode === 'quantity_edit' && (!Number.isFinite(quantityValue) || quantityValue === 0)) {
      setError(tCommon('required'));
      return;
    }
    if (dialogMode === 'quantity_edit' && tx.type !== 'adjustment' && quantityValue < 0) {
      setError(tCommon('required'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTransactionCorrectionAction({
        targetTransactionId: tx.id,
        correctionType: dialogMode,
        correctedQuantity: dialogMode === 'quantity_edit' ? quantityValue : undefined,
        note: note.trim() || undefined,
        userId: session?.user?.id ?? '',
      });
      if (!result.success) {
        toast.error(tCommon(getErrorKey(result.error)));
        return;
      }
      toast.success(t('correctionSuccess'));
      setDialogMode(null);
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{t('title')}</DrawerTitle>
        </DrawerHeader>

        {tx && (
          <div className="overflow-y-auto px-4">
            {/* Hero */}
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <StatusBadge status={tx.type} />
              <p className="text-base font-semibold">{tx.productName}</p>
              {tx.variantName && (
                <p className="text-sm text-muted-foreground">{tx.variantName}</p>
              )}
            </div>

            <Separator />

            {/* Quantity highlight */}
            <div className="flex justify-center py-4">
              <div className="rounded-2xl bg-muted px-8 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('quantity')}</p>
                <p className={
                  'text-3xl font-bold tabular-nums ' +
                  (tx.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')
                }>
                  {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                </p>
              </div>
            </div>

            <Separator />

            {/* Detail rows */}
            <div className="divide-y divide-border/60">
              <Row label={t('transactionId')}>#{tx.id}</Row>
              <Row label={t('date')}>{formatDateTime(tx.createdAt)}</Row>
              <Row label={t('stockBefore')}>{tx.stockBefore}</Row>
              <Row label={t('stockAfter')}>{tx.stockAfter}</Row>
              {tx.variantName && (
                <Row label={t('variant')}>{tx.variantName}</Row>
              )}
              {stockOutTypeLabel && (
                <Row label={t('stockOutType')}>{stockOutTypeLabel}</Row>
              )}
              {tx.salePrice != null && (
                <Row label={t('salePrice')}>{formatPrice(tx.salePrice)}</Row>
              )}
              {tx.purchasePrice != null && (
                <Row label={t('purchasePrice')}>{formatPrice(tx.purchasePrice)}</Row>
              )}
              {tx.isGift && (
                <Row label={t('isGift')}>✓</Row>
              )}
              {tx.targetTransactionId && (
                <Row label={t('targetTransaction')}>#{tx.targetTransactionId}</Row>
              )}
              {correctionTypeLabel && (
                <Row label={t('correctionType')}>{correctionTypeLabel}</Row>
              )}
              {tx.correctedQuantity != null && (
                <Row label={t('correctedQuantity')}>{tx.correctedQuantity}</Row>
              )}
              <Row label={t('user')}>{tx.userName ?? '-'}</Row>
              {tx.note && <Row label={t('note')}>{tx.note}</Row>}
            </div>

            {canCreateCorrection && (
              <>
                <Separator />
                <div className="space-y-3 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{t('correctionSection')}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{t('correctionHelp')}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" onClick={() => setDialogMode('quantity_edit')}>
                      {t('correctQuantity')}
                    </Button>
                    <Button variant="outline" className="text-destructive" onClick={() => setDialogMode('cancellation')}>
                      {t('cancelTransaction')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DrawerFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('close')}
          </Button>
        </DrawerFooter>
      </DrawerContent>

      {tx && (
        <Dialog open={dialogMode !== null} onOpenChange={(nextOpen) => !nextOpen && setDialogMode(null)}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'cancellation' ? t('cancelDialogTitle') : t('correctDialogTitle')}
              </DialogTitle>
              <DialogDescription>{t('correctionHelp')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {dialogMode === 'quantity_edit' && (
                <FormField
                  label={t('correctedQuantity')}
                  description={t('correctedQuantityHelp')}
                  required
                  error={error}
                >
                  <Input
                    type="number"
                    min={tx.type === 'adjustment' ? undefined : 1}
                    step={1}
                    value={correctedQuantity}
                    onChange={(event) => {
                      setCorrectedQuantity(event.target.value);
                      setError('');
                    }}
                    aria-invalid={!!error}
                  />
                </FormField>
              )}

              <FormField label={t('correctionNote')}>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={t('correctionNotePlaceholder')}
                  rows={3}
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogMode(null)} disabled={isSubmitting}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleSubmitCorrection} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {dialogMode === 'cancellation' ? t('submitCancellation') : t('submitCorrection')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Drawer>
  );
}
