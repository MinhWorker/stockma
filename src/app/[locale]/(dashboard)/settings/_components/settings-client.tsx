'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ActionBar } from '@/components/layout/action-bar';
import { FormSection } from '@/components/forms/form-section';
import { UserTable } from '@/app/[locale]/(dashboard)/settings/_components/user-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  saveGeneralSettingsAction,
  saveNotificationSettingsAction,
} from '@/actions/settings.action';
import type { User } from '@/types/user';

interface Props {
  users: User[];
}

export function SettingsClient({ users }: Props) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const [companyName, setCompanyName] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [language, setLanguage] = useState('vi');
  const [lowStock, setLowStock] = useState(true);
  const [stockOut, setStockOut] = useState(true);
  const [newTransaction, setNewTransaction] = useState(false);

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

  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">{t('tabs.general')}</TabsTrigger>
        <TabsTrigger value="notifications">{t('tabs.notifications')}</TabsTrigger>
        <TabsTrigger value="users">{t('tabs.users')}</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4 pt-4">
        <FormSection title={t('general.title')} description={t('general.desc')}>
          <div className="grid gap-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">{t('general.companyName')}</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('general.companyNamePlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">{t('general.currency')}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VND">VND</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="language">{t('general.language')}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>
        <div>
          <Button onClick={handleSaveGeneral}>{tCommon('saveChanges')}</Button>
        </div>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-4 pt-4">
        <FormSection title={t('notifications.title')} description={t('notifications.desc')}>
          <div className="space-y-4 max-w-md">
            {(
              [
                { key: 'lowStock', checked: lowStock, onChange: setLowStock },
                { key: 'stockOut', checked: stockOut, onChange: setStockOut },
                { key: 'newTransaction', checked: newTransaction, onChange: setNewTransaction },
              ] as const
            ).map(({ key, checked, onChange }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>{t(`notifications.${key}`)}</Label>
                  <p className="text-sm text-muted-foreground">{t(`notifications.${key}Desc`)}</p>
                </div>
                <Switch checked={checked} onCheckedChange={onChange} />
              </div>
            ))}
          </div>
        </FormSection>
        <div>
          <Button onClick={handleSaveNotifications}>{tCommon('saveChanges')}</Button>
        </div>
      </TabsContent>

      <TabsContent value="users" className="space-y-4 pt-4">
        <ActionBar
          action={
            <Button>
              <Plus className="mr-2 size-4" />
              {t('users.addUser')}
            </Button>
          }
        />
        <UserTable data={users} />
      </TabsContent>
    </Tabs>
  );
}
