'use server';

import {
  saveSubscription,
  deleteSubscription,
  updatePreferences,
  updatePreferencesByUserId,
  getSubscriptionsByUserId,
  type PushSubscriptionInput,
  type NotificationPreferences,
} from '@/services/notification.service';

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function subscribeAction(
  userId: string,
  sub: PushSubscriptionInput,
  prefs: NotificationPreferences
): Promise<ActionResult> {
  try {
    await saveSubscription(userId, sub, prefs);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function unsubscribeAction(endpoint: string): Promise<ActionResult> {
  try {
    await deleteSubscription(endpoint);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getSubscriptionPrefsAction(userId: string): Promise<{
  lowStock: boolean;
  stockOut: boolean;
  newTransaction: boolean;
} | null> {
  try {
    const sub = await getSubscriptionsByUserId(userId);
    if (!sub) return null;
    return { lowStock: sub.lowStock, stockOut: sub.stockOut, newTransaction: sub.newTransaction };
  } catch {
    return null;
  }
}

export async function updateNotificationPrefsAction(
  endpoint: string,
  prefs: NotificationPreferences
): Promise<ActionResult> {
  try {
    // Update by endpoint if provided, otherwise no-op (subscription not yet created)
    if (endpoint) {
      await updatePreferences(endpoint, prefs);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function updateNotificationPrefsByUserAction(
  userId: string,
  prefs: NotificationPreferences
): Promise<ActionResult> {
  try {
    await updatePreferencesByUserId(userId, prefs);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
