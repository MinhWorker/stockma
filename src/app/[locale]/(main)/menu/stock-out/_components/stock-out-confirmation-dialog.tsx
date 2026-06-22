'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPrice } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { ProductSummary, StockOutType } from '@/services/types';

interface GiftLine {
  id: string;
  product?: ProductSummary;
  variantName?: string;
  quantity: number;
}

interface StockOutConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductSummary;
  variantName?: string;
  quantity: number;
  stockOutType: StockOutType;
  salePrice?: number;
  defaultPrice?: number;
  gifts: GiftLine[];
  debtorName?: string;
  paidAmount?: number;
  note?: string;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const stockOutTypeLabels: Record<StockOutType, string> = {
  retail: 'Bán lẻ',
  wholesale: 'Bán sỉ',
  transfer: 'Chuyển kho',
};

export function StockOutConfirmationDialog({
  open,
  onOpenChange,
  product,
  variantName,
  quantity,
  stockOutType,
  salePrice,
  defaultPrice,
  gifts,
  debtorName,
  paidAmount,
  note,
  onConfirm,
  isSubmitting,
}: StockOutConfirmationDialogProps) {
  const isSale = stockOutType === 'retail' || stockOutType === 'wholesale';
  const effectivePrice = salePrice ?? defaultPrice ?? 0;
  const total = isSale ? effectivePrice * quantity : 0;
  const hasDebt = isSale && !!debtorName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Kiểm tra phiếu xuất</DialogTitle>
          <DialogDescription>
            Xem lại hàng xuất, giá bán và thông tin ghi nợ trước khi trừ tồn kho.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-4 py-4">
            <div className="rounded-xl border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground">Loại xuất kho</p>
              <p className="mt-1 text-sm font-semibold">{stockOutTypeLabels[stockOutType]}</p>
            </div>

            <div className="divide-y divide-border overflow-hidden rounded-xl border">
              <div className="bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{product?.name}</p>
                    {variantName && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{variantName}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isSale
                        ? `${quantity} x ${formatPrice(effectivePrice)}`
                        : `Số lượng chuyển: ${quantity}`}
                    </p>
                  </div>
                  {isSale && (
                    <p className="whitespace-nowrap text-sm font-semibold">{formatPrice(total)}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/40 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Số lượng xuất</p>
                <p className="font-semibold">{quantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {isSale ? 'Tổng tiền bán' : 'Giá trị bán'}
                </p>
                <p className="font-semibold text-primary">
                  {isSale ? formatPrice(total) : 'Không áp dụng'}
                </p>
              </div>
            </div>

            {gifts.length > 0 && (
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Hàng tặng kèm</p>
                <div className="space-y-2">
                  {gifts.map((gift) => (
                    <div key={gift.id} className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{gift.product?.name}</p>
                        {gift.variantName && (
                          <p className="text-xs text-muted-foreground">{gift.variantName}</p>
                        )}
                      </div>
                      <p className="whitespace-nowrap text-muted-foreground">x {gift.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasDebt && (
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Ghi nợ</p>
                <p className="font-medium">{debtorName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Đã thanh toán: {formatPrice(paidAmount ?? 0)}
                </p>
              </div>
            )}

            {note && (
              <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Ghi chú</p>
                <p className="text-muted-foreground italic">&ldquo;{note}&rdquo;</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row gap-2 p-6 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Quay lại chỉnh sửa
          </Button>
          <Button className="flex-1" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Đang ghi nhận...' : 'Xác nhận xuất kho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
