'use server';

import { revalidateTag } from 'next/cache';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
} from '@/services/product.service';
import {
  createVariant,
  updateVariant,
  deleteVariant,
} from '@/services/variant.service';
import { logActivity } from '@/services/activity.service';
import { PRODUCT_CACHE_TAG } from '@/services/product.service';
import { ACTIVITY_CACHE_TAG } from '@/services/activity.service';
import { getAllCategories } from '@/services/category.service';
import { getAllProviders } from '@/services/provider.service';
import { getAllInventories } from '@/services/inventory.service';
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
} from '@/services/types';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getProductFormDataAction() {
  const [categories, providers, inventories] = await Promise.all([
    getAllCategories(),
    getAllProviders(),
    getAllInventories(),
  ]);
  return { categories, providers, inventories };
}

export async function getProductsAction() {
  return getAllProducts();
}

export async function createProductAction(
  input: CreateProductInput,
  userId: string
): Promise<ActionResult> {
  try {
    const product = await createProduct(input);
    await logActivity({
      action: 'create',
      entityType: 'Product',
      entityId: product.id,
      entityName: product.name,
      description: `Tạo sản phẩm "${product.name}"`,
      inventoryId: product.inventoryId,
      userId,
    });
    revalidateTag(PRODUCT_CACHE_TAG, 'default');
    revalidateTag(ACTIVITY_CACHE_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function updateProductAction(
  id: number,
  input: UpdateProductInput,
  userId: string
): Promise<ActionResult> {
  try {
    const product = await updateProduct(id, input);
    await logActivity({
      action: 'update',
      entityType: 'Product',
      entityId: product.id,
      entityName: product.name,
      description: `Cập nhật sản phẩm "${product.name}"`,
      inventoryId: product.inventoryId,
      userId,
    });
    revalidateTag(PRODUCT_CACHE_TAG, 'default');
    revalidateTag(ACTIVITY_CACHE_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function deleteProductAction(id: number, userId: string): Promise<ActionResult> {
  try {
    // Fetch name before deletion for the log
    const products = await getAllProducts();
    const product = products.find((p) => p.id === id);
    await deleteProduct(id);
    await logActivity({
      action: 'delete',
      entityType: 'Product',
      entityId: id,
      entityName: product?.name,
      description: `Xóa sản phẩm "${product?.name ?? id}"`,
      inventoryId: product?.inventoryId,
      userId,
    });
    revalidateTag(PRODUCT_CACHE_TAG, 'default');
    revalidateTag(ACTIVITY_CACHE_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ---------------------------------------------------------------------------
// Variant actions
// ---------------------------------------------------------------------------

export async function createVariantAction(
  input: CreateVariantInput,
  userId: string
): Promise<ActionResult<import('@/services/types').VariantSummary>> {
  try {
    const variant = await createVariant(input);
    await logActivity({
      action: 'create',
      entityType: 'ProductVariant',
      entityId: variant.id,
      entityName: variant.name,
      description: `Tạo phân loại "${variant.name}" cho sản phẩm #${input.productId}`,
      userId,
    });
    revalidateTag(PRODUCT_CACHE_TAG, 'default');
    revalidateTag(ACTIVITY_CACHE_TAG, 'default');
    return { success: true, data: variant };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function updateVariantAction(
  id: number,
  input: UpdateVariantInput,
  userId: string
): Promise<ActionResult<import('@/services/types').VariantSummary>> {
  try {
    const variant = await updateVariant(id, input);
    await logActivity({
      action: 'update',
      entityType: 'ProductVariant',
      entityId: variant.id,
      entityName: variant.name,
      description: `Cập nhật phân loại "${variant.name}"`,
      userId,
    });
    revalidateTag(PRODUCT_CACHE_TAG, 'default');
    revalidateTag(ACTIVITY_CACHE_TAG, 'default');
    return { success: true, data: variant };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function deleteVariantAction(id: number, userId: string): Promise<ActionResult> {
  try {
    await deleteVariant(id);
    await logActivity({
      action: 'delete',
      entityType: 'ProductVariant',
      entityId: id,
      description: `Xóa phân loại #${id}`,
      userId,
    });
    revalidateTag(PRODUCT_CACHE_TAG, 'default');
    revalidateTag(ACTIVITY_CACHE_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

