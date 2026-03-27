'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function LangSwitchButton({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const isEn = locale === 'en';

  function toggle() {
    router.replace(pathname, { locale: isEn ? 'vi' : 'en' });
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} className={cn('gap-2', className)}>
      <span className="relative flex size-5 items-center justify-center rounded-sm border text-[10px] font-bold leading-none">
        {isEn ? 'E' : 'V'}
      </span>
      {isEn ? 'English' : 'Tiếng Việt'}
    </Button>
  );
}
