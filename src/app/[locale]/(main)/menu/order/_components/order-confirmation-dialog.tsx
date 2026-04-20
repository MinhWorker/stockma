'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPrice } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { OrderItem, OrderGlobalFields } from '../_context/order-context';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OrderItem[];
  global: OrderGlobalFields;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function OrderConfirmationDialog({
  open, onOpenChange, items, global, onConfirm, isSubmitting,
}: Props) {
  const t = useTranslations('order');
  const tCommon = useTranslations('common');

  const total = items.reduce((acc, item) => {
    const price = item.salePrice ? Number(item.salePrice) : (item.variant?.effectivePrice ?? item.product.price);
    return acc + price * item.quantity;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{t('confirmTitle')}</DialogTitle>
          <DialogDescription>{t('confirmDesc')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-4 py-4">
            <div className="divide-y divide-border border rounded-xl overflow-hidden">
              {items.map((item) => {
                const price = item.salePrice ? Number(item.salePrice) : (item.variant?.effectivePrice ?? item.product.price);
                return (
                  <div key={item.key} className="p-3 flex justify-between items-start gap-3 bg-card">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight mb-1">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground mb-1">{item.variant.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatPrice(price)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold whitespace-nowrap">
                      {formatPrice(price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center font-bold text-lg px-1">
              <span>{t('total')}</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>

            {(global.note || global.debtorName) && (
              <div className="space-y-3 rounded-xl bg-muted/50 p-4 text-sm border border-border">
                {global.debtorName && (
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {t('debtorName')}
                    </p>
                    <p className="font-medium">{global.debtorName}</p>
                    {global.paidAmount && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('paidAmount')}: {formatPrice(Number(global.paidAmount))}
                      </p>
                    )}
                  </div>
                )}
                {global.note && (
                  <div>
                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {t('note')}
                    </p>
                    <p className="text-muted-foreground italic">&ldquo;{global.note}&rdquo;</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {tCommon('cancel')}
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? tCommon('submitting') : tCommon('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
