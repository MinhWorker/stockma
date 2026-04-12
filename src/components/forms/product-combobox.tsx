'use client';

import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import { Link } from '@/i18n/routing';
import type { ProductSummary } from '@/services/types';

interface ProductComboboxProps {
  products: ProductSummary[];
  productId: number;
  productSearch: string;
  onProductChange: (id: number) => void;
  onSearchChange: (search: string) => void;
  error?: boolean;
  placeholder?: string;
  /** When provided, shows an "Add new product" link at the bottom of the dropdown */
  addNewHref?: string;
}

export function ProductCombobox({
  products,
  productId,
  productSearch,
  onProductChange,
  onSearchChange,
  error,
  placeholder,
  addNewHref,
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
        {addNewHref && (
          <div className="border-t border-border px-2 py-2">
            <Link
              href={addNewHref as Parameters<typeof Link>[0]['href']}
              className="flex items-center gap-1.5 w-full rounded-sm px-2 py-1.5 text-sm text-primary font-medium hover:bg-muted transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('form.addNewProduct')}
            </Link>
          </div>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
