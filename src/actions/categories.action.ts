'use server';

import { revalidateTag } from 'next/cache';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/category.service';

const CATEGORY_TAG = 'categories';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getCategoriesAction() {
  return getAllCategories();
}

export async function createCategoryAction(data: {
  name: string;
  state: string;
}): Promise<ActionResult> {
  try {
    await createCategory(data);
    revalidateTag(CATEGORY_TAG, 'default');
    revalidateTag('products', 'default'); // products list includes categoryName
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function updateCategoryAction(
  id: number,
  data: { name?: string; state?: string }
): Promise<ActionResult> {
  try {
    await updateCategory(id, data);
    revalidateTag(CATEGORY_TAG, 'default');
    revalidateTag('products', 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function deleteCategoryAction(id: number): Promise<ActionResult> {
  try {
    await deleteCategory(id);
    revalidateTag(CATEGORY_TAG, 'default');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
