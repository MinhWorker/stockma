'use server';

import { revalidateTag } from 'next/cache';
import { createProduct, updateProduct, deleteProduct, getAllProducts } from '@/services/product.service';
import { createVariant, updateVariant, deleteVariant } from '@/services/variant.service';
import { logActivity, ACTIVITY_CACHE_TAG } from '@/services/activity.service';
import { PRODUCT_CACHE_TAG } from '@/services/product.service';
import { getAllCategories } from '@/services/category.service';
import { getAllProviders } from '@/services/provider.service';
import { getAllInventories } from '@/services/inventory.service';
import { withUser } from '@/lib/action';
import type { CreateProductInput, UpdateProductInput, CreateVariantInput, UpdateVariantInput } from '@/services/types';

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

export const createProductAction = withUser(async (user, input: CreateProductInput): Promise<ActionResult> => {
  try {
    const product = await createProduct(input);
    await logActivity({
      action: 'create',
      entityType: 'Product',
      entityId: product.id,
      entityName: product.name,
      description: `Tạo sản phẩm "${product.name}"`,
      inventoryId: product.inventoryId,
      userId: user.id,
    });
    revalidateTag(PRODUCT_CACHE_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export const updateProductAction = withUser(async (user, id: number, input: UpdateProductInput): Promise<ActionResult> => {
  try {
    const product = await updateProduct(id, input);
    await logActivity({
      action: 'update',
      entityType: 'Product',
      entityId: product.id,
      entityName: product.name,
      description: `Cập nhật sản phẩm "${product.name}"`,
      inventoryId: product.inventoryId,
      userId: user.id,
    });
    revalidateTag(PRODUCT_CACHE_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export const deleteProductAction = withUser(async (user, id: number): Promise<ActionResult> => {
  try {
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
      userId: user.id,
    });
    revalidateTag(PRODUCT_CACHE_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

// ---------------------------------------------------------------------------
// Variant actions
// ---------------------------------------------------------------------------

export const createVariantAction = withUser(async (
  user,
  input: CreateVariantInput
): Promise<ActionResult<import('@/services/types').VariantSummary>> => {
  try {
    const variant = await createVariant(input);
    await logActivity({
      action: 'create',
      entityType: 'ProductVariant',
      entityId: variant.id,
      entityName: variant.name,
      description: `Tạo phân loại "${variant.name}" cho sản phẩm #${input.productId}`,
      userId: user.id,
    });
    revalidateTag(PRODUCT_CACHE_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true, data: variant };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export const updateVariantAction = withUser(async (
  user,
  id: number,
  input: UpdateVariantInput
): Promise<ActionResult<import('@/services/types').VariantSummary>> => {
  try {
    const variant = await updateVariant(id, input);
    await logActivity({
      action: 'update',
      entityType: 'ProductVariant',
      entityId: variant.id,
      entityName: variant.name,
      description: `Cập nhật phân loại "${variant.name}"`,
      userId: user.id,
    });
    revalidateTag(PRODUCT_CACHE_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true, data: variant };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export const deleteVariantAction = withUser(async (user, id: number): Promise<ActionResult> => {
  try {
    await deleteVariant(id);
    await logActivity({
      action: 'delete',
      entityType: 'ProductVariant',
      entityId: id,
      description: `Xóa phân loại #${id}`,
      userId: user.id,
    });
    revalidateTag(PRODUCT_CACHE_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

// ---------------------------------------------------------------------------
// Batch variant sync — apply all pending ops in a single server call
// ---------------------------------------------------------------------------

export type VariantPendingOp =
  | { type: 'create'; data: CreateVariantInput }
  | { type: 'update'; id: number; data: UpdateVariantInput }
  | { type: 'delete'; id: number };

export const syncVariantsAction = withUser(async (
  user,
  productId: number,
  productName: string,
  ops: VariantPendingOp[]
): Promise<ActionResult> => {
  try {
    for (const op of ops) {
      if (op.type === 'create') {
        const v = await createVariant(op.data);
        await logActivity({
          action: 'create',
          entityType: 'ProductVariant',
          entityId: v.id,
          entityName: v.name,
          description: `Tạo phân loại "${v.name}" cho sản phẩm "${productName}"`,
          userId: user.id,
        });
      } else if (op.type === 'update') {
        const v = await updateVariant(op.id, op.data);
        await logActivity({
          action: 'update',
          entityType: 'ProductVariant',
          entityId: v.id,
          entityName: v.name,
          description: `Cập nhật phân loại "${v.name}"`,
          userId: user.id,
        });
      } else if (op.type === 'delete') {
        await deleteVariant(op.id);
        await logActivity({
          action: 'delete',
          entityType: 'ProductVariant',
          entityId: op.id,
          description: `Xóa phân loại #${op.id}`,
          userId: user.id,
        });
      }
    }
    revalidateTag(PRODUCT_CACHE_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});


