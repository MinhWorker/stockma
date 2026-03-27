'use server';

import { revalidateTag } from 'next/cache';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
} from '@/services/product.service';
import { PRODUCT_TAG } from '@/services/product.service';
import type { CreateProductInput, UpdateProductInput } from '@/services/types';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getProductsAction() {
  const products = await getAllProducts();
  return products;
}

export async function createProductAction(input: CreateProductInput): Promise<ActionResult> {
  try {
    await createProduct(input);
    revalidateTag(PRODUCT_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function updateProductAction(
  id: number,
  input: UpdateProductInput
): Promise<ActionResult> {
  try {
    await updateProduct(id, input);
    revalidateTag(PRODUCT_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  try {
    await deleteProduct(id);
    revalidateTag(PRODUCT_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
