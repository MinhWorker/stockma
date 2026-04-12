// ---------------------------------------------------------------------------
// Shared types for the product form components
// ---------------------------------------------------------------------------

export type ProductFormValues = {
  name: string;
  costPrice: number;
  price: number;
  categoryId: number;
  providerId: number;
  inventoryId: number;
  description: string;
  unit: string;
};

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

/** A draft row — positive id = existing saved variant, negative = new unsaved row */
export type VariantDraft = {
  id: number;
  name: string;
  costPrice: string;
  price: string;
  unit: string;
  stockQty?: number; // only present for existing saved variants
};

export type VariantDraftErrors = Partial<Record<'name' | 'costPrice' | 'price', string>>;
