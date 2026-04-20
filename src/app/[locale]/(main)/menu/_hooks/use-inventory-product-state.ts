'use client';

import { useState, useEffect } from 'react';
import { getProductsAction } from '@/actions/products.action';
import type { ProductSummary } from '@/services/types';

export function useInventoryProductState() {
  const [productId, setProductId] = useState<number>(0);
  const [variantId, setVariantId] = useState<number | undefined>(undefined);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    getProductsAction().then(setProducts);
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);
  const hasVariants = (selectedProduct?.variants?.length ?? 0) > 0;
  const selectedVariant = selectedProduct?.variants?.find((v) => v.id === variantId);

  const resetProduct = () => {
    setProductId(0);
    setVariantId(undefined);
    setProductSearch('');
  };

  return {
    productId,
    setProductId,
    variantId,
    setVariantId,
    products,
    productSearch,
    setProductSearch,
    selectedProduct,
    hasVariants,
    selectedVariant,
    resetProduct,
  };
}
