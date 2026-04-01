'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useOrder } from '../_context/order-context';
import { createStockOutAction } from '@/actions/inventory.action';
import { useSession } from '@/lib/auth-client';
import { getErrorKey } from '@/lib/error-message';
import { formatPrice, cn } from '@/lib/utils';
import type { StockOutType } from '@/services/types';

export function OrderReviewDrawer() {
  const t = useTranslations('order');
  const tCommon = useTranslations('common');
  const { state, actions } = useOrder();
  const { data: session } = useSession();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { items, global, reviewOpen } = state;
  const isDebt = global.stockOutType === 'retail' || global.stockOutType === 'wholesale';

  function validate() {
    const e: Record<string, string> = {};
    if (!global.stockOutType) e.stockOutType = t('errRequired');
    items.forEach((item) => {
      if (item.quantity < 1) e[`qty_${item.key}`] = t('errQty');
    });
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setIsSubmitting(true);
    const userId = session?.user?.id ?? '';
    let successCount = 0;

    try {
      for (const item of items) {
        const effectivePrice = item.variant?.effectivePrice ?? item.product.price;
        const result = await createStockOutAction({
          productId: item.product.id,
          variantId: item.variant?.id,
          quantity: item.quantity,
          stockOutType: global.stockOutType as StockOutType,
          salePrice: item.salePrice ? Number(item.salePrice) : effectivePrice,
          note: global.note || undefined,
          debtorName: isDebt && global.debtorName ? global.debtorName : undefined,
          paidAmount: isDebt && global.paidAmount ? Number(global.paidAmount) : undefined,
          userId,
        });
        if (result.success) successCount++;
        else toast.error(`${item.product.name}: ${tCommon(getErrorKey(result.error))}`);
      }

      if (successCount > 0) {
        toast.success(t('successToast', { count: successCount }));
        actions.reset();
        startTransition(() => router.refresh());
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer open={reviewOpen} onOpenChange={(open) => !open && actions.closeReview()}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle>{t('itemsTitle')} ({items.length})</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 space-y-4 pb-2">
          {/* Global fields */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('globalFields')}</p>

            <div className="space-y-1">
              <p className="text-sm font-medium">{t('stockOutType')}</p>
              <Select value={global.stockOutType} onValueChange={(v) => { actions.setGlobal('stockOutType', v as StockOutType); setErrors((e) => ({ ...e, stockOutType: '' })); }}>
                <SelectTrigger className={cn('w-full', errors.stockOutType && 'border-destructive')}>
                  <SelectValue placeholder={t('stockOutTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">{t('stockOutTypes.retail')}</SelectItem>
                  <SelectItem value="wholesale">{t('stockOutTypes.wholesale')}</SelectItem>
                  <SelectItem value="transfer">{t('stockOutTypes.transfer')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.stockOutType && <p className="text-xs text-destructive">{errors.stockOutType}</p>}
            </div>

            {isDebt && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('debtorName')}</p>
                  <Input value={global.debtorName} onChange={(e) => actions.setGlobal('debtorName', e.target.value)} placeholder={t('debtorNamePlaceholder')} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('paidAmount')}</p>
                  <Input type="number" min={0} value={global.paidAmount} onChange={(e) => actions.setGlobal('paidAmount', e.target.value)} placeholder="0" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-medium">{t('note')}</p>
              <Textarea value={global.note} onChange={(e) => actions.setGlobal('note', e.target.value)} placeholder={t('notePlaceholder')} rows={2} />
            </div>
          </div>

          <Separator />

          {/* Item list */}
          <div className="space-y-3">
            {items.map((item) => {
              const effectivePrice = item.variant?.effectivePrice ?? item.product.price;
              return (
                <div key={item.key} className="rounded-xl border border-border bg-card p-3 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{formatPrice(effectivePrice)}</p>
                    </div>
                    <button onClick={() => actions.removeItem(item.key)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Qty + price row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{t('qty')}</p>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => actions.setQty(item.key, Number(e.target.value))}
                        className={cn('h-8 text-sm', errors[`qty_${item.key}`] && 'border-destructive')}
                      />
                    </div>
                    {global.stockOutType !== 'transfer' && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{t('salePrice')}</p>
                        <Input
                          type="number"
                          min={0}
                          value={item.salePrice}
                          onChange={(e) => actions.setSalePrice(item.key, e.target.value)}
                          placeholder={String(effectivePrice)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={actions.closeReview} disabled={isSubmitting}>
            {tCommon('cancel')}
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting || items.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? tCommon('submitting') : t('confirmBtn', { count: items.length })}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
