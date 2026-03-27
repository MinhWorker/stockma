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
import { Badge } from '@/components/ui/badge';
import type { ProductSummary } from '@/services/types';

const STATUS_VARIANT = {
  active: 'default',
  low_stock: 'secondary',
  out_of_stock: 'destructive',
} as const;

function formatPrice(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{children}</span>
    </div>
  );
}

interface Props {
  product: ProductSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (p: ProductSummary) => void;
}

export function ProductDetailDrawer({ product: p, open, onOpenChange, onEdit }: Props) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{p?.name ?? ''}</DrawerTitle>
        </DrawerHeader>
        {p && (
          <div className="overflow-y-auto px-4">
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm text-muted-foreground">{p.categoryName}</span>
              <Badge variant={STATUS_VARIANT[p.status]}>
                {p.status === 'active'
                  ? 'Còn hàng'
                  : p.status === 'low_stock'
                    ? 'Sắp hết'
                    : 'Hết hàng'}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-center py-4">
              <div className="rounded-2xl bg-muted px-8 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('columns.stock')}</p>
                <p className="text-3xl font-bold tabular-nums">{p.stockQty}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tái đặt hàng khi &lt; {p.reorderLevel}
                </p>
              </div>
            </div>
            <Separator />
            <div className="divide-y divide-border/60">
              <Row label={t('form.costPrice')}>{formatPrice(p.costPrice)}</Row>
              <Row label={t('form.retailPrice')}>{formatPrice(p.price)}</Row>
              {p.providerName && <Row label="Nhà cung cấp">{p.providerName}</Row>}
              {p.shortDescription && (
                <div className="py-3 space-y-1">
                  <p className="text-sm text-muted-foreground">{t('form.description')}</p>
                  <p className="text-sm">{p.shortDescription}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            {tCommon('close')}
          </Button>
          {p && (
            <Button
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onEdit(p);
              }}
            >
              {tCommon('edit')}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
