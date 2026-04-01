import 'server-only';
import webpush from 'web-push';
import { prisma } from '@/lib/db';

const isVapidConfigured =
  !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;

if (isVapidConfigured) {
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
    create: { userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, ...prefs },
    update: { p256dh: sub.p256dh, auth: sub.auth, ...prefs },
  });
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function updatePreferences(
  endpoint: string,
  prefs: NotificationPreferences
): Promise<void> {
  await prisma.pushSubscription.updateMany({ where: { endpoint }, data: prefs });
}

export async function updatePreferencesByUserId(
  userId: string,
  prefs: NotificationPreferences
): Promise<void> {
  await prisma.pushSubscription.updateMany({ where: { userId }, data: prefs });
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

export async function sendNotificationToAll(
  event: NotificationEvent,
  payload: PushPayload
): Promise<void> {
  if (!isVapidConfigured) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { [event]: true },
  });

  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map((sub) => sendToSubscription(sub, message))
  );
}

async function sendToSubscription(
  sub: { id: number; endpoint: string; p256dh: string; auth: string },
  message: string
): Promise<void> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      message
    );
  } catch (err: unknown) {
    // 410 Gone means the subscription has expired — remove it
    const isExpired =
      err &&
      typeof err === 'object' &&
      'statusCode' in err &&
      (err as { statusCode: number }).statusCode === 410;

    if (isExpired) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } });
    }
  }
}
