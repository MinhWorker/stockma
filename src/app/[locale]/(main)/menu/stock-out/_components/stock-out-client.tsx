'use client';

import { useCallback, useId, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { CreditCard, Gift, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import { SegmentedSelect } from '@/components/forms/segmented-select';
import { PriceInput } from '@/components/forms/price-input';
import { ProductPickerPanel } from '@/components/forms/product-picker-panel';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import { createStockOutAction } from '@/actions/inventory.action';
import { useSession } from '@/lib/auth-client';
import { getErrorKey } from '@/lib/error-message';
import { useWithLoading } from '@/components/feedback/loading-overlay';
import type { StockOutType, GiftItemInput } from '@/services/types';
import { useInventoryProductState } from '../../_hooks/use-inventory-product-state';
import { VariantChipSelector } from '../../_components/variant-chip-selector';
import { TransactionDoneState } from '../../_components/transaction-done-state';
import { StockOutConfirmationDialog } from './stock-out-confirmation-dialog';

interface GiftItemState {
  id: string; // local key
  productId: number;
  productSearch: string;
  variantId: number | undefined;
  variantSearch: string;
  quantity: number;
}

function newGiftItem(): GiftItemState {
  return {
    id: Math.random().toString(36).slice(2),
    productId: 0,
    productSearch: '',
    variantId: undefined,
    variantSearch: '',
    quantity: 1,
  };
}

export function StockOutClient() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { data: session } = useSession();

  const quantityId = useId();
  const noteId = useId();

  const productState = useInventoryProductState();
  const {
    productId,
    setProductId,
    variantId,
    setVariantId,
    products,
    isLoadingProducts,
    productSearch,
    setProductSearch,
    selectedProduct,
    hasVariants,
    selectedVariant,
    resetProduct,
  } = productState;

  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [stockOutType, setStockOutType] = useState<StockOutType | ''>('');
  const [salePrice, setSalePrice] = useState('');

  // Gift items
  const [gifts, setGifts] = useState<GiftItemState[]>([]);
  const [showDebtFields, setShowDebtFields] = useState(false);

  // Debt fields
  const [debtorName, setDebtorName] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const withLoading = useWithLoading();
  const [done, setDone] = useState(false);

  const effectivePrice = selectedVariant?.effectivePrice ?? selectedProduct?.price;
  const isRetailOrWholesale = stockOutType === 'retail' || stockOutType === 'wholesale';
  const stockOutTypeOptions: { value: StockOutType; label: string; description: string }[] = [
    { value: 'retail', label: 'Bán lẻ', description: 'Có giá bán' },
    { value: 'wholesale', label: 'Bán sỉ', description: 'Có giá bán' },
    { value: 'transfer', label: 'Chuyển kho', description: 'Không tính tiền' },
  ];

  function handleProductChange(v: number) {
    setProductId(v);
    setProductSearch('');
    setVariantId(undefined);
    setSalePrice('');
    setErrors((prev) => ({ ...prev, productId: '' }));
  }

  // Gift item helpers
  function addGift() {
    setGifts((prev) => [...prev, newGiftItem()]);
  }

  function removeGift(id: string) {
    setGifts((prev) => prev.filter((g) => g.id !== id));
  }

  function updateGift(id: string, patch: Partial<GiftItemState>) {
    setGifts((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  const handleReview = useCallback(() => {
    const e: Record<string, string> = {};
    if (!productId) e.productId = tCommon('required');
    if (!quantity || quantity < 1) e.quantity = tCommon('required');
    if (!stockOutType) e.stockOutType = tCommon('required');
    if (hasVariants && !variantId) e.variantId = tCommon('required');

    if (Object.keys(e).filter((k) => e[k]).length) {
      setErrors(e);
      return;
    }

    setIsConfirmOpen(true);
  }, [productId, quantity, stockOutType, hasVariants, variantId, tCommon]);

  const handleSubmit = useCallback(async () => {
    // Build gift items
    const giftItems: GiftItemInput[] = gifts
      .filter((g) => g.productId > 0 && g.quantity > 0)
      .map((g) => ({
        productId: g.productId,
        variantId: g.variantId,
        quantity: g.quantity,
      }));

    setIsSubmitting(true);
    await withLoading(async () => {
      try {
        const result = await createStockOutAction({
          productId,
          quantity,
          note: note || undefined,
          userId: session?.user?.id ?? '',
          stockOutType: stockOutType as StockOutType,
          variantId,
          salePrice: salePrice ? Number(salePrice) : undefined,
          gifts: giftItems.length > 0 ? giftItems : undefined,
          debtorName: isRetailOrWholesale && debtorName ? debtorName : undefined,
          paidAmount: isRetailOrWholesale && paidAmount ? Number(paidAmount) : undefined,
        });
        if (!result.success) {
          toast.error(tCommon(getErrorKey(result.error)));
          return;
        }
        toast.success(t('submitSuccess'));
        setIsConfirmOpen(false);
        setDone(true);
      } catch {
        toast.error(tCommon('error'));
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [
    productId,
    quantity,
    note,
    stockOutType,
    variantId,
    salePrice,
    gifts,
    debtorName,
    paidAmount,
    isRetailOrWholesale,
    session,
    t,
    tCommon,
    withLoading,
  ]);

  function handleReset() {
    resetProduct();
    setQuantity(1);
    setNote('');
    setStockOutType('');
    setSalePrice('');
    setGifts([]);
    setShowDebtFields(false);
    setDebtorName('');
    setPaidAmount('');
    setErrors({});
    setIsConfirmOpen(false);
    setDone(false);
  }

  function handleClose() {
    const params = new URLSearchParams(window.location.search);
    const backTo = (params.get('back') ?? '/menu') as Parameters<typeof router.push>[0];
    router.push(backTo);
  }

  if (done) {
    return (
      <TransactionDoneState
        title={t('submitSuccess')}
        subtitle={t('tabs.stockOut')}
        resetLabel="Xuất thêm hàng"
        closeLabel="Về trang chủ"
        onReset={handleReset}
        onClose={handleClose}
      />
    );
  }

  return (
    <>
      <div className="space-y-4 px-4 py-4" inert={isSubmitting || isConfirmOpen || undefined}>
        {/* Stock-out type selector */}
        <FormField label="Loại xuất kho" required error={errors.stockOutType}>
          <SegmentedSelect
            aria-label="Loại xuất kho"
            value={stockOutType}
            options={stockOutTypeOptions}
            error={!!errors.stockOutType}
            onValueChange={(v) => {
              setStockOutType(v as StockOutType);
              setErrors((prev) => ({ ...prev, stockOutType: '' }));
              // Reset gift/debt when switching to transfer
              if (v === 'transfer') {
                setGifts([]);
                setShowDebtFields(false);
                setDebtorName('');
                setPaidAmount('');
              }
            }}
          />
        </FormField>

        {/* Product selector */}
        <FormField label={t('form.product')} required error={errors.productId}>
          <ProductPickerPanel
            products={products}
            productId={productId}
            productSearch={productSearch}
            onProductChange={handleProductChange}
            onSearchChange={setProductSearch}
            isLoading={isLoadingProducts}
            error={!!errors.productId}
          />
          {selectedProduct && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('form.currentStock', { qty: selectedProduct.stockQty })}
            </p>
          )}
        </FormField>

        {/* Variant selector */}
        {hasVariants && (
          <VariantChipSelector
            label="Phân loại"
            required
            variants={selectedProduct?.variants ?? []}
            selectedId={variantId}
            onSelect={(v) => {
              setVariantId(v);
              setSalePrice('');
              setErrors((prev) => ({ ...prev, variantId: '' }));
            }}
            error={errors.variantId}
            getPrice={(v) => v.effectivePrice}
            disableOutOfStock
          />
        )}
        {hasVariants && !variantId && (
          <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
            Chọn đúng phân loại hàng cần xuất để hệ thống kiểm tra tồn kho và giá bán.
          </p>
        )}

        {/* Quantity */}
        <FormField label={t('form.quantity')} required error={errors.quantity} htmlFor={quantityId}>
          <Input
            id={quantityId}
            type="number"
            min={1}
            step={1}
            value={quantity || ''}
            onChange={(e) => {
              setQuantity(Math.floor(Number(e.target.value)));
              setErrors((prev) => ({ ...prev, quantity: '' }));
            }}
            placeholder={t('form.quantityPlaceholder')}
            aria-invalid={!!errors.quantity}
          />
        </FormField>

        {/* Sale price — only for retail/wholesale */}
        {isRetailOrWholesale && (
          <FormField label="Giá bán" description="Để trống nếu dùng giá bán mặc định của sản phẩm.">
            <PriceInput
              value={salePrice}
              onChange={(v) => setSalePrice(String(v || ''))}
              placeholder={
                hasVariants && !variantId
                  ? 'Chọn phân loại để xem giá bán mặc định'
                  : effectivePrice != null
                    ? `Mặc định: ${effectivePrice.toLocaleString()}`
                    : 'Giá bán (tùy chọn)'
              }
            />
          </FormField>
        )}

        {/* Note */}
        <FormField label={t('form.note')} htmlFor={noteId}>
          <Textarea
            id={noteId}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('form.notePlaceholder')}
            rows={3}
          />
        </FormField>

        {/* Gift items — only for retail/wholesale */}
        {isRetailOrWholesale && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Hàng tặng kèm</p>
                <p className="text-xs text-muted-foreground">Chỉ thêm khi đơn xuất có hàng tặng.</p>
              </div>
              <Button size="sm" variant="outline" onClick={addGift}>
                <Gift className="h-3.5 w-3.5" />
                Thêm hàng tặng
              </Button>
            </div>
            {gifts.map((gift) => {
              const giftProduct = products.find((p) => p.id === gift.productId);
              const giftHasVariants = (giftProduct?.variants?.length ?? 0) > 0;
              const giftVariant = giftProduct?.variants?.find((v) => v.id === gift.variantId);
              const filteredGiftVariants = gift.variantSearch
                ? (giftProduct?.variants ?? []).filter((v) =>
                    v.name.toLowerCase().includes(gift.variantSearch.toLowerCase())
                  )
                : (giftProduct?.variants ?? []);

              return (
                <div key={gift.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium">Hàng tặng</span>
                      <p className="text-xs text-muted-foreground">
                        Nếu không cần, hãy xóa dòng này.
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Xóa hàng tặng"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeGift(gift.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <ProductPickerPanel
                    products={products}
                    productId={gift.productId}
                    productSearch={gift.productSearch}
                    placeholder="Chọn sản phẩm tặng"
                    onProductChange={(v) =>
                      updateGift(gift.id, {
                        productId: v,
                        productSearch: '',
                        variantId: undefined,
                        variantSearch: '',
                      })
                    }
                    onSearchChange={(search) => updateGift(gift.id, { productSearch: search })}
                  />
                  {giftHasVariants && (
                    <Combobox
                      value={gift.variantId ?? null}
                      onValueChange={(v) =>
                        updateGift(gift.id, {
                          variantId: v as number | undefined,
                          variantSearch: '',
                        })
                      }
                    >
                      <ComboboxInput
                        placeholder="Phân loại (tùy chọn)..."
                        value={
                          gift.variantId && !gift.variantSearch
                            ? (giftVariant?.name ?? '')
                            : gift.variantSearch
                        }
                        onChange={(e) => {
                          updateGift(gift.id, { variantSearch: e.target.value });
                          if (!e.target.value) updateGift(gift.id, { variantId: undefined });
                        }}
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          <ComboboxEmpty>{tCommon('noResults')}</ComboboxEmpty>
                          {filteredGiftVariants.map((v) => (
                            <ComboboxItem key={v.id} value={v.id}>
                              {v.name}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  )}
                  <Input
                    type="number"
                    min={1}
                    value={gift.quantity}
                    onChange={(e) => updateGift(gift.id, { quantity: Number(e.target.value) })}
                    placeholder="Số lượng"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Debt section — only for retail/wholesale */}
        {isRetailOrWholesale && (
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Ghi nợ</p>
                <p className="text-xs text-muted-foreground">
                  Chỉ điền khi khách chưa trả đủ tiền.
                </p>
              </div>
              {!showDebtFields && (
                <Button size="sm" variant="outline" onClick={() => setShowDebtFields(true)}>
                  <CreditCard className="h-3.5 w-3.5" />
                  Ghi nợ cho khách
                </Button>
              )}
            </div>
            {showDebtFields && (
              <div className="space-y-3 rounded-md border p-3">
                <FormField
                  label="Tên khách nợ"
                  description="Nhập tên người hoặc đơn vị còn nợ tiền."
                >
                  <Input
                    value={debtorName}
                    onChange={(e) => setDebtorName(e.target.value)}
                    placeholder="Tên khách hàng..."
                  />
                </FormField>
                <FormField
                  label="Đã thanh toán"
                  description="Nhập số tiền khách đã trả; để trống nếu chưa trả."
                >
                  <PriceInput
                    value={paidAmount}
                    onChange={(v) => setPaidAmount(String(v || ''))}
                    placeholder="Số tiền đã trả"
                  />
                </FormField>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setShowDebtFields(false);
                    setDebtorName('');
                    setPaidAmount('');
                  }}
                >
                  Bỏ ghi nợ
                </Button>
              </div>
            )}
          </div>
        )}

        <Button className="w-full" size="lg" onClick={handleReview} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? tCommon('submitting') : 'Xem lại phiếu xuất'}
        </Button>
      </div>

      {selectedProduct && stockOutType && (
        <StockOutConfirmationDialog
          open={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          product={selectedProduct}
          variantName={selectedVariant?.name}
          quantity={quantity}
          stockOutType={stockOutType}
          salePrice={salePrice ? Number(salePrice) : undefined}
          defaultPrice={effectivePrice}
          gifts={gifts
            .filter((gift) => gift.productId > 0 && gift.quantity > 0)
            .map((gift) => {
              const giftProduct = products.find((product) => product.id === gift.productId);
              const giftVariant = giftProduct?.variants.find(
                (variant) => variant.id === gift.variantId
              );

              return {
                id: gift.id,
                product: giftProduct,
                variantName: giftVariant?.name,
                quantity: gift.quantity,
              };
            })}
          debtorName={isRetailOrWholesale && debtorName ? debtorName : undefined}
          paidAmount={isRetailOrWholesale && paidAmount ? Number(paidAmount) : undefined}
          note={note || undefined}
          onConfirm={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
