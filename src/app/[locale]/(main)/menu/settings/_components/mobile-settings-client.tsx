'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SettingsSection } from './settings-section';
import { SettingsRow } from './settings-row';
import {
  saveGeneralSettingsAction,
  saveNotificationSettingsAction,
} from '@/actions/settings.action';

const CURRENCIES = ['VND', 'USD', 'EUR'];
const LANGUAGES = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];

export function MobileSettingsClient() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const [currency, setCurrency] = useState('VND');
  const [language, setLanguage] = useState('vi');
  const [lowStock, setLowStock] = useState(true);
  const [stockOut, setStockOut] = useState(true);
  const [newTransaction, setNewTransaction] = useState(false);

  const cycleCurrency = useCallback(() => {
    setCurrency((prev) => {
      const idx = CURRENCIES.indexOf(prev);
      return CURRENCIES[(idx + 1) % CURRENCIES.length];
    });
  }, []);

  const cycleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'vi' ? 'en' : 'vi'));
  }, []);

  const handleSaveGeneral = useCallback(async () => {
    const result = await saveGeneralSettingsAction({ currency, language });
    if (result.success) toast.success(t('general.saveSuccess'));
    else toast.error(result.error);
  }, [currency, language, t]);

  const handleSaveNotifications = useCallback(async () => {
    const result = await saveNotificationSettingsAction({ lowStock, stockOut, newTransaction });
    if (result.success) toast.success(t('notifications.saveSuccess'));
    else toast.error(result.error);
  }, [lowStock, stockOut, newTransaction, t]);

  const langLabel = LANGUAGES.find((l) => l.value === language)?.label ?? language;

  return (
    <div className="space-y-6 pb-6">
      {/* General */}
      <SettingsSection title={t('tabs.general')}>
        <SettingsRow
          type="action"
          label={t('general.currency')}
          value={currency}
          onClick={cycleCurrency}
        />
        <SettingsRow
          type="action"
          label={t('general.language')}
          value={langLabel}
          onClick={cycleLanguage}
        />
      </SettingsSection>
      <div className="px-4">
        <Button className="w-full" onClick={handleSaveGeneral}>
          {tCommon('saveChanges')}
        </Button>
      </div>

      {/* Notifications */}
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
      <div className="px-4">
        <Button className="w-full" onClick={handleSaveNotifications}>
          {tCommon('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
