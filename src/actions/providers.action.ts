'use server';

import { revalidateTag } from 'next/cache';
import { getAllProviders, createProvider, updateProvider, deleteProvider } from '@/services/provider.service';

const PROVIDER_TAG = 'providers';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getProvidersAction() {
  return getAllProviders();
}

export async function createProviderAction(data: { name: string }): Promise<ActionResult> {
  try {
    await createProvider(data);
    revalidateTag(PROVIDER_TAG, "default");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function updateProviderAction(id: number, data: { name: string }): Promise<ActionResult> {
  try {
    await updateProvider(id, data);
    revalidateTag(PROVIDER_TAG, "default");
    revalidateTag('products', "default");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function deleteProviderAction(id: number): Promise<ActionResult> {
  try {
    await deleteProvider(id);
    revalidateTag(PROVIDER_TAG, "default");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
