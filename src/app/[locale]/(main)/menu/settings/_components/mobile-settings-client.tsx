'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SettingsSection } from './settings-section';
import { SettingsRow } from './settings-row';
import {
  subscribeAction,
  unsubscribeAction,
  updateNotificationPrefsByUserAction,
} from '@/actions/notification.action';
import { useSession, signOut } from '@/lib/auth-client';
import { getErrorKey } from '@/lib/error-message';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return buffer;
}

interface NotifPrefs {
  lowStock: boolean;
  stockOut: boolean;
  newTransaction: boolean;
}

interface Props {
  initialPrefs: NotifPrefs | null;
}

export function MobileSettingsClient({ initialPrefs }: Props) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const locale = useLocale();

  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Init from server-fetched prefs — no flash of defaults
  const [lowStock, setLowStock] = useState(initialPrefs?.lowStock ?? true);
  const [stockOut, setStockOut] = useState(initialPrefs?.stockOut ?? true);
  const [newTransaction, setNewTransaction] = useState(initialPrefs?.newTransaction ?? false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [swSupported, setSwSupported] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setSwSupported(true);
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setSubscription(existing);
        setIsSubscribed(true);
      }
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push(`/${locale}/login`);
    } catch {
      toast.error(tCommon('error'));
    }
  }, [router, locale, tCommon]);

  const handleSubscribe = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      toast.error('VAPID public key not configured');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const key = sub.getKey('p256dh');
      const authKey = sub.getKey('auth');
      if (!key || !authKey) throw new Error('Missing push subscription keys');

      const result = await subscribeAction(
        userId!,
        {
          endpoint: sub.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey))),
        },
        { lowStock, stockOut, newTransaction }
      );
      if (result.success) {
        setSubscription(sub);
        setIsSubscribed(true);
        toast.success(t('notifications.subscribed'));
      } else {
        toast.error(tCommon(getErrorKey(result.error)));
      }
    } catch {
      toast.error(t('notifications.permissionDenied'));
    }
  }, [userId, lowStock, stockOut, newTransaction, t, tCommon]);

  const handleSavePrefs = useCallback(async () => {
    if (!userId) return;
    const result = await updateNotificationPrefsByUserAction(
      userId,
      { lowStock, stockOut, newTransaction }
    );
    if (result.success) toast.success(t('notifications.saveSuccess'));
    else toast.error(tCommon(getErrorKey(result.error)));
  }, [userId, lowStock, stockOut, newTransaction, t, tCommon]);

  return (
    <div className="space-y-6 pb-6">
      <SettingsSection title={t('tabs.notifications')}>
        <SettingsRow
          type="toggle"
          label={t('notifications.lowStock')}
          description={t('notifications.lowStockDesc')}
          checked={lowStock}
          onCheckedChange={setLowStock}
        />
        <SettingsRow
          type="toggle"
          label={t('notifications.stockOut')}
          description={t('notifications.stockOutDesc')}
          checked={stockOut}
          onCheckedChange={setStockOut}
        />
        <SettingsRow
          type="toggle"
          label={t('notifications.newTransaction')}
          description={t('notifications.newTransactionDesc')}
          checked={newTransaction}
          onCheckedChange={setNewTransaction}
        />
      </SettingsSection>

      <div className="px-4 space-y-2">
        {swSupported && !isSubscribed && (
          <Button className="w-full" onClick={handleSubscribe}>
            {t('notifications.subscribe')}
          </Button>
        )}
        {initialPrefs !== null && (
          <Button variant="secondary" className="w-full" onClick={handleSavePrefs}>
            {tCommon('saveChanges')}
          </Button>
        )}
      </div>

      <div className="px-4">
        <Button variant="destructive" className="w-full" onClick={handleSignOut}>
          {tAuth('signOut')}
        </Button>
      </div>
    </div>
  );
}
