'use client';

import { useTranslations } from 'next-intl';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2 } from 'lucide-react';
import type { ProductSummary } from '@/services/types';
import { formatPrice, cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function InfoRow({ label, children, valueClassName }: {
  label: string;
  children: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-sm font-semibold text-right', valueClassName)}>{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  product: ProductSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (p: ProductSummary) => void;
  deleteConfirmOpen: boolean;
  isDeleting: boolean;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductDetailDrawer({
  product: p,
  open,
  onOpenChange,
  onEdit,
  deleteConfirmOpen,
  isDeleting,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: Props) {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[88vh]">
          {p && (
            <>
              <VisuallyHidden><DrawerTitle>{p.name}</DrawerTitle></VisuallyHidden>
              {/* ── Header ── */}
              <div className="px-4 pt-2 pb-3">
                <h2 className="text-lg font-semibold leading-snug">{p.name}</h2>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground truncate">{p.categoryName}</span>
                  <Badge
                    variant={p.status === 'out_of_stock' ? 'destructive' : 'default'}
                    className="shrink-0"
                  >
                    {p.status === 'active' ? t('statusActive') : t('statusOutOfStock')}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* ── Body ── */}
              <div className="overflow-y-auto px-4">
                {/* Stock row — inline, no oversized box */}
                <InfoRow
                  label={t('columns.stock')}
                  valueClassName={p.stockQty === 0 ? 'text-destructive' : undefined}
                >
                  {p.stockQty}{p.unit ? ` ${p.unit}` : ''}
                </InfoRow>

                <Separator className="opacity-50" />

                {/* Pricing + provider */}
                <div className="divide-y divide-border/50">
                  {p.variants.length === 0 && (
                    <>
                      <InfoRow label={t('form.costPrice')}>{formatPrice(p.costPrice)}</InfoRow>
                      <InfoRow label={t('form.retailPrice')}>{formatPrice(p.price)}</InfoRow>
                    </>
                  )}
                  {p.providerName && (
                    <InfoRow label={t('providerLabel')}>{p.providerName}</InfoRow>
                  )}
                  {p.shortDescription && (
                    <div className="py-3.5 space-y-1">
                      <p className="text-sm text-muted-foreground">{t('form.description')}</p>
                      <p className="text-sm leading-relaxed">{p.shortDescription}</p>
                    </div>
                  )}
                </div>

                {/* Variants */}
                {p.variants && p.variants.length > 0 && (
                  <div className="pt-1 pb-3">
                    <Separator className="mb-3 opacity-50" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {t('variantsTitle')}
                    </p>
                    <div className="space-y-2">
                      {p.variants.map((v) => (
                        <div key={v.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{v.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatPrice(v.effectiveCostPrice)} / {formatPrice(v.effectivePrice)}
                              {v.effectiveUnit ? ` · ${v.effectiveUnit}` : ''}
                            </p>
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <p className="text-[10px] text-muted-foreground">{t('variantStock')}</p>
                            <p className={cn(
                              'text-sm font-semibold tabular-nums',
                              v.stockQty === 0 && 'text-destructive'
                            )}>
                              {v.stockQty}
                              {v.effectiveUnit && (
                                <span className="text-xs font-normal text-muted-foreground ml-1">{v.effectiveUnit}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <DrawerFooter className="flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  onClick={onDeleteRequest}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  {tCommon('close')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => { onOpenChange(false); onEdit(p); }}
                >
                  {tCommon('edit')}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Delete confirm dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={(o) => { if (!o) onDeleteCancel(); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirmDesc', { name: p?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onDeleteCancel} disabled={isDeleting}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={onDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
