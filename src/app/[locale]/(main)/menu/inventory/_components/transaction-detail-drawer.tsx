'use client';

import { useTranslations } from 'next-intl';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/data-display/status-badge';
import type { TransactionRecord } from '@/services/types';

interface Props {
  transaction: TransactionRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDateTime(d: Date) {
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{children}</span>
    </div>
  );
}

export function TransactionDetailDrawer({ transaction: tx, open, onOpenChange }: Props) {
  const t = useTranslations('transactions.detail');
  const tCommon = useTranslations('common');

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{t('title')}</DrawerTitle>
        </DrawerHeader>

        {tx && (
          <div className="overflow-y-auto px-4">
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <StatusBadge status={tx.type} />
              <p className="text-base font-semibold">{tx.productName}</p>
            </div>

            <Separator />

            <div className="flex justify-center py-4">
              <div className="rounded-2xl bg-muted px-8 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('quantity')}</p>
                <p
                  className={
                    'text-3xl font-bold tabular-nums ' +
                    (tx.quantity > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400')
                  }
                >
                  {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                </p>
              </div>
            </div>

            <Separator />

            <div className="divide-y divide-border/60">
              <Row label={t('transactionId')}>#{tx.id}</Row>
              <Row label={t('date')}>{formatDateTime(tx.createdAt)}</Row>
              <Row label={t('stockBefore')}>{tx.stockBefore}</Row>
              <Row label={t('stockAfter')}>{tx.stockAfter}</Row>
              <Row label={t('user')}>{tx.userName ?? '-'}</Row>
              {tx.note && <Row label={t('note')}>{tx.note}</Row>}
            </div>
          </div>
        )}

        <DrawerFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('close')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
