'use client';

import { useCallback, useId, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/forms/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PriceInput } from '@/components/forms/price-input';
import { ProductCombobox } from '@/components/forms/product-combobox';
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
    productId, setProductId, variantId, setVariantId, products,
    productSearch, setProductSearch, selectedProduct, hasVariants,
    selectedVariant, resetProduct,
  } = productState;

  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [stockOutType, setStockOutType] = useState<StockOutType | ''>('');
  const [salePrice, setSalePrice] = useState('');

  // Gift items
  const [gifts, setGifts] = useState<GiftItemState[]>([]);

  // Debt fields
  const [debtorName, setDebtorName] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const withLoading = useWithLoading();
  const [done, setDone] = useState(false);

  const effectivePrice = selectedVariant?.effectivePrice ?? selectedProduct?.price;
  const isRetailOrWholesale = stockOutType === 'retail' || stockOutType === 'wholesale';

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
    setGifts((prev) => prev.map((g) => g.id === id ? { ...g, ...patch } : g));
  }

  const handleSubmit = useCallback(async () => {
    const e: Record<string, string> = {};
    if (!productId) e.productId = tCommon('required');
    if (!quantity || quantity < 1) e.quantity = tCommon('required');
    if (!stockOutType) e.stockOutType = tCommon('required');
    if (hasVariants && !variantId) e.variantId = tCommon('required');

    if (Object.keys(e).filter((k) => e[k]).length) {
      setErrors(e);
      return;
    }

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
        if (!result.success) { toast.error(tCommon(getErrorKey(result.error))); return; }
        toast.success(t('submitSuccess'));
        setDone(true);
      } catch {
        toast.error(tCommon('error'));
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [
    productId, quantity, note, stockOutType, variantId, salePrice,
    gifts, debtorName, paidAmount, isRetailOrWholesale, session, t, tCommon, hasVariants, withLoading,
  ]);

  function handleReset() {
    resetProduct();
    setQuantity(1);
    setNote('');
    setStockOutType('');
    setSalePrice('');
    setGifts([]);
    setDebtorName('');
    setPaidAmount('');
    setErrors({});
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
        onReset={handleReset}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="space-y-4 px-4 py-4" inert={isSubmitting || undefined}>
      {/* Stock-out type selector */}
      <FormField label="Loại xuất kho" required error={errors.stockOutType}>
        <Select
          value={stockOutType}
          onValueChange={(v) => {
            setStockOutType(v as StockOutType);
            setErrors((prev) => ({ ...prev, stockOutType: '' }));
            // Reset gift/debt when switching to transfer
            if (v === 'transfer') {
              setGifts([]);
              setDebtorName('');
              setPaidAmount('');
            }
          }}
        >
          <SelectTrigger className="w-full" aria-invalid={!!errors.stockOutType}>
            <SelectValue placeholder="Chọn loại xuất kho" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="retail">Bán lẻ</SelectItem>
            <SelectItem value="wholesale">Bán sỉ</SelectItem>
            <SelectItem value="transfer">Chuyển kho</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {/* Product selector */}
      <FormField label={t('form.product')} required error={errors.productId}>
        <ProductCombobox
          products={products}
          productId={productId}
          productSearch={productSearch}
          onProductChange={handleProductChange}
          onSearchChange={(s) => { setProductSearch(s); if (!s) handleProductChange(0); }}
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
        />
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
        <FormField label="Giá bán">
          <PriceInput
            value={salePrice}
            onChange={(v) => setSalePrice(String(v || ''))}
            placeholder={effectivePrice != null ? `Mặc định: ${effectivePrice.toLocaleString()}` : 'Giá bán (tùy chọn)'}
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
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Tặng phẩm</p>
            <Button size="sm" variant="outline" onClick={addGift}>
              <Plus className="h-3 w-3 mr-1" />
              Thêm
            </Button>
          </div>
          {gifts.map((gift) => {
            const giftProduct = products.find((p) => p.id === gift.productId);
            const giftHasVariants = (giftProduct?.variants?.length ?? 0) > 0;
            const giftVariant = giftProduct?.variants?.find((v) => v.id === gift.variantId);
            const giftProductInputValue = gift.productId && !gift.productSearch
              ? (giftProduct?.name ?? '')
              : gift.productSearch;
            const filteredGiftVariants = gift.variantSearch
              ? (giftProduct?.variants ?? []).filter((v) =>
                  v.name.toLowerCase().includes(gift.variantSearch.toLowerCase())
                )
              : (giftProduct?.variants ?? []);

            return (
              <div key={gift.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tặng phẩm</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeGift(gift.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Combobox
                  value={gift.productId || null}
                  onValueChange={(v) =>
                    updateGift(gift.id, {
                      productId: v as number,
                      productSearch: '',
                      variantId: undefined,
                      variantSearch: '',
                    })
                  }
                >
                  <ComboboxInput
                    placeholder="Chọn sản phẩm tặng..."
                    value={giftProductInputValue}
                    onChange={(e) => {
                      updateGift(gift.id, { productSearch: e.target.value });
                      if (!e.target.value) updateGift(gift.id, { productId: 0 });
                    }}
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      <ComboboxEmpty>{tCommon('noResults')}</ComboboxEmpty>
                      {(gift.productSearch
                        ? products.filter((p) =>
                            p.name.toLowerCase().includes(gift.productSearch.toLowerCase())
                          )
                        : products
                      ).map((p) => (
                        <ComboboxItem key={p.id} value={p.id}>
                          <span className="flex-1 truncate">{p.name}</span>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {giftHasVariants && (
                  <Combobox
                    value={gift.variantId ?? null}
                    onValueChange={(v) =>
                      updateGift(gift.id, { variantId: v as number | undefined, variantSearch: '' })
                    }
                  >
                    <ComboboxInput
                      placeholder="Phân loại (tùy chọn)..."
                      value={gift.variantId && !gift.variantSearch
                        ? (giftVariant?.name ?? '')
                        : gift.variantSearch}
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
          <p className="text-sm font-medium">Ghi nợ (tùy chọn)</p>
          <FormField label="Tên khách nợ">
            <Input
              value={debtorName}
              onChange={(e) => setDebtorName(e.target.value)}
              placeholder="Tên khách hàng..."
            />
          </FormField>
          <FormField label="Đã thanh toán">
            <PriceInput
              value={paidAmount}
              onChange={(v) => setPaidAmount(String(v || ''))}
              placeholder="Số tiền đã trả (0 = chưa trả)"
            />
          </FormField>
        </div>
      )}

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? tCommon('submitting') : tCommon('save')}
      </Button>
    </div>
  );
}
