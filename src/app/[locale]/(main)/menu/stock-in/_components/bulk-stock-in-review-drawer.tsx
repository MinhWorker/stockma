'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PriceInput } from '@/components/forms/price-input';
import { Separator } from '@/components/ui/separator';
import { createTransactionAction } from '@/actions/inventory.action';
import { useSession } from '@/lib/auth-client';
import { getErrorKey } from '@/lib/error-message';
import { useWithLoading } from '@/components/feedback/loading-overlay';
import { formatPrice, cn } from '@/lib/utils';
import { useBulkStockIn } from '../_context/bulk-stock-in-context';
import { BulkStockInConfirmationDialog } from './bulk-stock-in-confirmation-dialog';
import { ProductAvatar } from '@/components/data-display/product-avatar';

export function BulkStockInReviewDrawer() {
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { data: session } = useSession();
  const { state, actions } = useBulkStockIn();
  const [, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const withLoading = useWithLoading();

  const { items, note, reviewOpen } = state;

  function validate() {
    const nextErrors: Record<string, string> = {};
    items.forEach((item) => {
      if (item.quantity < 1) nextErrors[`qty_${item.key}`] = 'Số lượng phải lớn hơn 0';
    });
    return nextErrors;
  }

  function handleReviewConfirm() {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setIsConfirmOpen(true);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const userId = session?.user?.id ?? '';
    let successCount = 0;

    await withLoading(async () => {
      try {
        for (const item of items) {
          const result = await createTransactionAction({
            type: 'stock_in',
            productId: item.product.id,
            variantId: item.variant?.id,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : undefined,
            note: note || undefined,
            userId,
          });

          if (result.success) {
            successCount++;
          } else {
            toast.error(`${item.product.name}: ${tCommon(getErrorKey(result.error))}`);
          }
        }

        if (successCount > 0) {
          toast.success(`Đã ghi nhận ${successCount} phiếu nhập kho`);
          actions.reset();
          setIsConfirmOpen(false);
          startTransition(() => router.refresh());
        }
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  return (
    <>
      <Drawer open={reviewOpen} onOpenChange={(open) => !open && actions.closeReview()}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle>Hàng cần nhập ({items.length})</DrawerTitle>
          </DrawerHeader>

          <div className="space-y-4 overflow-y-auto px-4 pb-2" inert={isSubmitting || isConfirmOpen || undefined}>
            <div className="space-y-1">
              <p className="text-sm font-medium">Ghi chú chung</p>
              <Textarea
                value={note}
                onChange={(event) => actions.setNote(event.target.value)}
                placeholder="Ví dụ: nhập theo phiếu NCC hôm nay..."
                rows={2}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              {items.map((item) => {
                const defaultPrice = item.variant?.effectiveCostPrice ?? item.product.costPrice;
                return (
                  <div key={item.key} className="space-y-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-3">
                        <ProductAvatar
                          name={item.product.name}
                          imageUrl={item.product.imageUrl}
                          categoryName={item.product.categoryName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.product.name}</p>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Tồn hiện tại: {item.variant?.stockQty ?? item.product.stockQty}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => actions.removeItem(item.key)}
                        className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Xóa khỏi danh sách nhập"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Số lượng nhập</p>
                        <Input
                          type="number"
                          min={1}
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(event) => {
                            actions.setQty(item.key, Number(event.target.value));
                            setErrors((prev) => ({ ...prev, [`qty_${item.key}`]: '' }));
                          }}
                          className={cn('h-8 text-sm', errors[`qty_${item.key}`] && 'border-destructive')}
                        />
                        {errors[`qty_${item.key}`] && (
                          <p className="text-xs text-destructive">{errors[`qty_${item.key}`]}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Giá nhập</p>
                        <PriceInput
                          value={item.purchasePrice}
                          onChange={(value) => actions.setPurchasePrice(item.key, String(value || ''))}
                          placeholder={formatPrice(defaultPrice)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DrawerFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={actions.closeReview} disabled={isSubmitting}>
              Tiếp tục chọn
            </Button>
            <Button className="flex-1" onClick={handleReviewConfirm} disabled={isSubmitting || items.length === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xem lại trước khi nhập
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <BulkStockInConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        items={items}
        note={note}
        onConfirm={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
