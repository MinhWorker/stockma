import 'server-only';
import webpush from 'web-push';
import { prisma } from '@/lib/db';

const vapidConfigured =
  !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;

if (vapidConfigured) {
  webpush.setVapidDetails(
    'mailto:admin@stockma.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface NotificationPreferences {
  lowStock: boolean;
  stockOut: boolean;
  newTransaction: boolean;
}

export type NotificationEvent = 'lowStock' | 'stockOut' | 'newTransaction';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}

// ---------------------------------------------------------------------------
// Subscription management
// ---------------------------------------------------------------------------

export async function saveSubscription(
  userId: string,
  sub: PushSubscriptionInput,
  prefs: NotificationPreferences
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      lowStock: prefs.lowStock,
      stockOut: prefs.stockOut,
      newTransaction: prefs.newTransaction,
    },
    update: {
      p256dh: sub.p256dh,
      auth: sub.auth,
      lowStock: prefs.lowStock,
      stockOut: prefs.stockOut,
      newTransaction: prefs.newTransaction,
    },
  });
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function updatePreferences(
  endpoint: string,
  prefs: NotificationPreferences
): Promise<void> {
  await prisma.pushSubscription.updateMany({
    where: { endpoint },
    data: prefs,
  });
}

export async function updatePreferencesByUserId(
  userId: string,
  prefs: NotificationPreferences
): Promise<void> {
  await prisma.pushSubscription.updateMany({
    where: { userId },
    data: prefs,
  });
}

export async function getSubscriptionByEndpoint(endpoint: string) {
  return prisma.pushSubscription.findUnique({ where: { endpoint } });
}

export async function getSubscriptionsByUserId(userId: string) {
  return prisma.pushSubscription.findFirst({ where: { userId } });
}

// ---------------------------------------------------------------------------
// Sending notifications
// ---------------------------------------------------------------------------

/**
 * Send a push notification to all subscribers that have the given event enabled.
 */
export async function sendNotificationToAll(
  event: NotificationEvent,
  payload: PushPayload
): Promise<void> {
  if (!vapidConfigured) return;
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { [event]: true },
  });

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        );
      } catch (err: unknown) {
        // 410 Gone = subscription expired, clean it up
        if (
          err &&
          typeof err === 'object' &&
          'statusCode' in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
}
