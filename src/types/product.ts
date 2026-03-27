export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  costPrice: number;
  retailPrice: number;
  reorderLevel: number;
  stockQty: number;
  categoryId: number;
  categoryName: string;
  providerId: number | null;
  providerName: string | null;
  isActive: boolean;
  createdAt: string;
  status: ProductStatus;
}

export interface ProductFormValues {
  sku: string;
  name: string;
  description: string;
  costPrice: number;
  retailPrice: number;
  reorderLevel: number;
  categoryId: number;
  providerId: number | null;
}
