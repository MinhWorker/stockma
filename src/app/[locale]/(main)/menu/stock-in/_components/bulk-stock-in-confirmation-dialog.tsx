'use client';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPrice } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { BulkStockInItem } from '../_context/bulk-stock-in-context';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BulkStockInItem[];
  note: string;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function BulkStockInConfirmationDialog({
  open,
  onOpenChange,
  items,
  note,
  onConfirm,
  isSubmitting,
}: Props) {
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = items.reduce((sum, item) => {
    const price = item.purchasePrice ? Number(item.purchasePrice) : (item.variant?.effectiveCostPrice ?? item.product.costPrice);
    return sum + price * item.quantity;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Kiểm tra phiếu nhập</DialogTitle>
          <DialogDescription>
            Xem lại danh sách hàng nhập. Nếu cần sửa số lượng hoặc giá nhập, bấm Quay lại chỉnh sửa.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-4 py-4">
            <div className="divide-y divide-border overflow-hidden rounded-xl border">
              {items.map((item) => {
                const price = item.purchasePrice ? Number(item.purchasePrice) : (item.variant?.effectiveCostPrice ?? item.product.costPrice);
                return (
                  <div key={item.key} className="flex items-start justify-between gap-3 bg-card p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{item.product.name}</p>
                      {item.variant && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.variant.name}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.quantity} x {formatPrice(price)}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold">
                      {formatPrice(price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/40 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Tổng số lượng</p>
                <p className="font-semibold">{totalQty}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng giá nhập</p>
                <p className="font-semibold text-primary">{formatPrice(totalCost)}</p>
              </div>
            </div>

            {note && (
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Ghi chú chung</p>
                <p className="text-muted-foreground italic">&ldquo;{note}&rdquo;</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row gap-2 p-6 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Quay lại chỉnh sửa
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Đang ghi nhận...' : 'Xác nhận nhập kho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
