'use server';

import { revalidateTag } from 'next/cache';
import { getAllCategories, createCategory, updateCategory, deleteCategory, getCategoryById } from '@/services/category.service';
import { logActivity, ACTIVITY_CACHE_TAG } from '@/services/activity.service';
import { withUser } from '@/lib/action';

const CATEGORY_TAG = 'categories';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getCategoriesAction() {
  return getAllCategories();
}

export const createCategoryAction = withUser(async (user, data: { name: string; state: string }): Promise<ActionResult> => {
  try {
    const category = await createCategory(data);
    await logActivity({
      action: 'create',
      entityType: 'Category',
      entityId: category.id,
      entityName: category.name,
      description: `Tạo danh mục "${category.name}"`,
      userId: user.id,
    });
    revalidateTag(CATEGORY_TAG, 'default');
    revalidateTag('products', 'default');
    revalidateTag(ACTIVITY_CACHE_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export const updateCategoryAction = withUser(async (user, id: number, data: { name?: string; state?: string }): Promise<ActionResult> => {
  try {
    const category = await updateCategory(id, data);
    await logActivity({
      action: 'update',
      entityType: 'Category',
      entityId: category.id,
      entityName: category.name,
      description: `Cập nhật danh mục "${category.name}"`,
      userId: user.id,
    });
    revalidateTag(CATEGORY_TAG, 'default');
    revalidateTag('products', 'default');
    revalidateTag(ACTIVITY_CACHE_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export const deleteCategoryAction = withUser(async (user, id: number): Promise<ActionResult> => {
  try {
    const category = await getCategoryById(id);
    await deleteCategory(id);
    await logActivity({
      action: 'delete',
      entityType: 'Category',
      entityId: id,
      entityName: category?.name,
      description: `Xóa danh mục "${category?.name ?? id}"`,
      userId: user.id,
    });
    revalidateTag(CATEGORY_TAG, 'default');
    revalidateTag(ACTIVITY_CACHE_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});
