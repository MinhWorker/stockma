'use client';

import { useTranslations } from 'next-intl';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import type { ProductSummary } from '@/services/types';

interface ProductComboboxProps {
  products: ProductSummary[];
  productId: number;
  productSearch: string;
  onProductChange: (id: number) => void;
  onSearchChange: (search: string) => void;
  error?: boolean;
  placeholder?: string;
}

export function ProductCombobox({
  products,
  productId,
  productSearch,
  onProductChange,
  onSearchChange,
  error,
  placeholder,
}: ProductComboboxProps) {
  const tCommon = useTranslations('common');
  const t = useTranslations('inventory');

  const selectedProduct = products.find((p) => p.id === productId);

  const inputValue = productId && !productSearch
    ? (selectedProduct?.name ?? '')
    : productSearch;

  const filtered = productSearch
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  return (
    <Combobox
      value={productId || null}
      onValueChange={(v) => onProductChange(v as number)}
    >
      <ComboboxInput
        placeholder={placeholder ?? t('form.productPlaceholder')}
        value={inputValue}
        onChange={(e) => {
          onSearchChange(e.target.value);
          if (!e.target.value) onProductChange(0);
        }}
        aria-invalid={error}
      />
      <ComboboxContent>
        <ComboboxList>
          {filtered.length === 0
            ? <ComboboxEmpty>{tCommon('noResults')}</ComboboxEmpty>
            : null}
          {filtered.map((p) => (
            <ComboboxItem key={p.id} value={p.id}>
              <span className="flex-1 truncate">{p.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{p.categoryName}</span>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
