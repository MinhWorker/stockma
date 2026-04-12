'use server';

import { revalidateTag } from 'next/cache';
import { getAllProviders, createProvider, updateProvider, deleteProvider, getProviderById } from '@/services/provider.service';
import { logActivity, ACTIVITY_CACHE_TAG } from '@/services/activity.service';
import { withUser } from '@/lib/action';
import type { ProviderSummary } from '@/services/types';

const PROVIDER_TAG = 'providers';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getProvidersAction() {
  return getAllProviders();
}

export const createProviderAction = withUser(async (user, data: { name: string }): Promise<ActionResult<ProviderSummary>> => {
  try {
    const provider = await createProvider(data);
    await logActivity({
      action: 'create',
      entityType: 'Provider',
      entityId: provider.id,
      entityName: provider.name,
      description: `Tạo nhà cung cấp "${provider.name}"`,
      userId: user.id,
    });
    revalidateTag(PROVIDER_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true, data: provider };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export const updateProviderAction = withUser(async (user, id: number, data: { name: string }): Promise<ActionResult> => {
  try {
    const provider = await updateProvider(id, data);
    await logActivity({
      action: 'update',
      entityType: 'Provider',
      entityId: provider.id,
      entityName: provider.name,
      description: `Cập nhật nhà cung cấp "${provider.name}"`,
      userId: user.id,
    });
    revalidateTag(PROVIDER_TAG, { expire: 0 });
    revalidateTag('products', { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

export const deleteProviderAction = withUser(async (user, id: number): Promise<ActionResult> => {
  try {
    const provider = await getProviderById(id);
    await deleteProvider(id);
    await logActivity({
      action: 'delete',
      entityType: 'Provider',
      entityId: id,
      entityName: provider?.name,
      description: `Xóa nhà cung cấp "${provider?.name ?? id}"`,
      userId: user.id,
    });
    revalidateTag(PROVIDER_TAG, { expire: 0 });
    revalidateTag(ACTIVITY_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
});

