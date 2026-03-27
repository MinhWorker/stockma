'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { createTransactionAction } from '@/actions/inventory.action';
import type { TransactionRecord, TransactionType } from '@/services/types';
import { MobileFilterBar } from './mobile-filter-bar';
import { MobileTransactionList } from './mobile-transaction-list';
import { TransactionDetailDrawer } from './transaction-detail-drawer';
import { Fab } from './fab';
import { InventoryProvider, useInventory } from './inventory-context';

// ---- Root export: wraps with provider ----

interface Props {
  initialData: TransactionRecord[];
}

export function MobileInventoryClient({ initialData }: Props) {
  return (
    <InventoryProvider>
      <InventoryShell initialData={initialData} />
    </InventoryProvider>
  );
}

// ---- Inner shell: consumes context, no prop drilling ----

function InventoryShell({ initialData }: Props) {
  const t = useTranslations('inventory');
  const { state, actions } = useInventory();

  // Client-side filter derived from URL state — no extra useState
  const filtered = useMemo(() => {
    const q = state.search.toLowerCase();
    return initialData.filter((tx) => {
      const matchTab = state.tab === 'all' || tx.type === state.tab;
      const matchSearch = !q || tx.productName.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [initialData, state.search, state.tab]);

  return (
    <>
      {/* Search */}
      <div className="relative px-4 py-2">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={state.inputValue}
          onChange={(e) => actions.setInputValue(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-9 pr-9 bg-muted border-0 rounded-xl h-10"
        />
        {state.inputValue && (
          <button
            onClick={() => actions.setInputValue('')}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <MobileFilterBar active={state.tab} onChange={actions.setTab} />

      {/* Count */}
      <p className="px-4 pb-1 text-xs text-muted-foreground">{filtered.length} giao dịch</p>

      {/* List */}
      <MobileTransactionList
        transactions={filtered}
        emptyTitle={t('emptyFilterTitle')}
        emptyDesc={t('emptyFilterDesc')}
        onSelect={actions.openDetail}
      />

      {/* FAB */}
      <Fab onClick={actions.openForm} label={t('newTransaction')} />

      {/* Detail drawer */}
      <TransactionDetailDrawer
        transaction={state.selectedTx}
        open={state.detailOpen}
        onOpenChange={(open) => !open && actions.closeDetail()}
      />

      {/* Form — inline transaction form using server action */}
      <TransactionFormDrawer
        open={state.formOpen}
        onClose={actions.closeForm}
        onSuccess={() => actions.closeForm()}
      />
    </>
  );
}

// ---- Inline form drawer using server action directly ----

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/form-field';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';
import { Input as NumberInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { getProductsAction } from '@/actions/products.action';
import { useEffect, useId } from 'react';
import type { ProductSummary } from '@/services/types';

const TX_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'stock_in', label: 'Nhập kho' },
  { value: 'stock_out', label: 'Xuất kho' },
  { value: 'adjustment', label: 'Điều chỉnh' },
];

function TransactionFormDrawer({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const tCommon = useTranslations('common');
  const t = useTranslations('inventory');
  const quantityId = useId();
  const noteId = useId();

  const [type, setType] = useState<TransactionType>('stock_in');
  const [productId, setProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getProductsAction().then(setProducts);
  }, []);

  useEffect(() => {
    if (!open) {
      setType('stock_in');
      setProductId(0);
      setQuantity(1);
      setNote('');
      setProductSearch('');
      setErrors({});
    }
  }, [open]);

  const filtered = productSearch
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const selectedProduct = products.find((p) => p.id === productId);

  async function handleSubmit() {
    const e: Record<string, string> = {};
    if (!productId) e.productId = tCommon('required');
    if (!quantity || quantity < 1) e.quantity = tCommon('required');
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTransactionAction({ type, productId, quantity, note, userId: 1 });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t('submitSuccess'));
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{t('form.title')}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 space-y-4 pb-2">
          <FormField label={t('form.type')} required>
            <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TX_TYPES.map((tt) => (
                  <SelectItem key={tt.value} value={tt.value}>
                    {tt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t('form.product')} required error={errors.productId}>
            <Combobox
              value={productId || null}
              onValueChange={(v) => {
                setProductId(v as number);
                setProductSearch('');
              }}
            >
              <ComboboxInput
                placeholder={t('form.productPlaceholder')}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                aria-invalid={!!errors.productId}
              />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>{tCommon('noResults')}</ComboboxEmpty>
                  {filtered.map((p) => (
                    <ComboboxItem key={p.id} value={p.id}>
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{p.categoryName}</span>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {selectedProduct && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('form.currentStock', { qty: selectedProduct.stockQty })}
              </p>
            )}
          </FormField>

          <FormField
            label={t('form.quantity')}
            required
            error={errors.quantity}
            htmlFor={quantityId}
          >
            <NumberInput
              id={quantityId}
              type="number"
              min={1}
              step={1}
              value={quantity || ''}
              onChange={(e) => setQuantity(Math.floor(Number(e.target.value)))}
              aria-invalid={!!errors.quantity}
            />
          </FormField>

          <FormField label={t('form.note')} htmlFor={noteId}>
            <Textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('form.notePlaceholder')}
              rows={3}
            />
          </FormField>
        </div>
        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            {tCommon('cancel')}
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? tCommon('submitting') : tCommon('save')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
