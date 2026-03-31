'use server';

import { revalidateTag } from 'next/cache';
import { createInventory, updateInventory, deleteInventory } from '@/services/inventory.service';

const INVENTORY_TAG = 'inventories';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createInventoryAction(data: { name: string; description?: string }): Promise<ActionResult> {
  try {
    await createInventory(data);
    revalidateTag(INVENTORY_TAG, "default");
    revalidateTag('products', "default");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function updateInventoryAction(id: number, data: { name?: string; description?: string }): Promise<ActionResult> {
  try {
    await updateInventory(id, data);
    revalidateTag(INVENTORY_TAG, "default");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function deleteInventoryAction(id: number): Promise<ActionResult> {
  try {
    await deleteInventory(id);
    revalidateTag(INVENTORY_TAG, "default");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
