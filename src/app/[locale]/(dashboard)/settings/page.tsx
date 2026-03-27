import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getMockUsers } from '@/lib/mock/users';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsClient } from '@/app/[locale]/(dashboard)/settings/_components/settings-client';

export default async function SettingsPage() {
  const t = await getTranslations('settings');
  return (
    <div className="space-y-4">
      <PageHeader title={t('title')} />
      <Suspense
        fallback={<div className="h-64 rounded-xl border border-border animate-pulse bg-muted" />}
      >
        <SettingsData />
      </Suspense>
    </div>
  );
}

async function SettingsData() {
  const users = await getMockUsers();
  return <SettingsClient users={users} />;
}
