'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionDoneStateProps {
  title: string;
  subtitle: string;
  onReset: () => void;
  onClose: () => void;
}

export function TransactionDoneState({
  title,
  subtitle,
  onReset,
  onClose,
}: TransactionDoneStateProps) {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 px-4 text-center">
      <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
      <div className="space-y-1">
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="min-h-[44px]" onClick={onClose}>
          {tCommon('close')}
        </Button>
        <Button className="min-h-[44px]" onClick={onReset}>
          {t('newTransaction')}
        </Button>
      </div>
    </div>
  );
}
