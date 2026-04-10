'use server';

import { revalidateTag } from 'next/cache';
import { createInventory, updateInventory, deleteInventory, getInventoryById } from '@/services/inventory.service';
import { logActivity, ACTIVITY_CACHE_TAG } from '@/services/activity.service';
import { withUser } from '@/lib/action';

const INVENTORY_TAG = 'inventories';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export const createInventoryAction = withUser(async (user, data: { name: string; description?: string }): Promise<ActionResult> => {
  try {
    const inventory = await createInventory(data);
    await logActivity({
      action: 'create',
      entityType: 'Inventory',
      entityId: inventory.id,
      entityName: inventory.name,
      description: `Tạo kho "${inventory.name}"`,
      userId: user.id,
    });
    revalidateTag(INVENTORY_TAG, { expire: 0 });
    revalidateTag('products', { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export const updateInventoryAction = withUser(async (user, id: number, data: { name?: string; description?: string }): Promise<ActionResult> => {
  try {
    const inventory = await updateInventory(id, data);
    await logActivity({
      action: 'update',
      entityType: 'Inventory',
      entityId: inventory.id,
      entityName: inventory.name,
      description: `Cập nhật kho "${inventory.name}"`,
      userId: user.id,
    });
    revalidateTag(INVENTORY_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export const deleteInventoryAction = withUser(async (user, id: number): Promise<ActionResult> => {
  try {
    const inventory = await getInventoryById(id);
    await deleteInventory(id);
    await logActivity({
      action: 'delete',
      entityType: 'Inventory',
      entityId: id,
      entityName: inventory?.name,
      description: `Xóa kho "${inventory?.name ?? id}"`,
      userId: user.id,
    });
    revalidateTag(INVENTORY_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

