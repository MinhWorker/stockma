'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

export default function MainLoading() {
  const t = useTranslations('loading');

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">{t('message')}</p>
    </div>
  );
}
