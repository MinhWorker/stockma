'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Menu, Moon, Sun, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function HeaderActionsMenu() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && (theme === 'dark' || resolvedTheme === 'dark');
  const isEn = locale === 'en';

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  const toggleLang = () => router.replace(pathname, { locale: isEn ? 'vi' : 'en' });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {isDark ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : (
            <Sun className="mr-2 h-4 w-4" />
          )}
          <span>{isDark ? tCommon('darkMode') : tCommon('lightMode')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={toggleLang} className="cursor-pointer">
          <Languages className="mr-2 h-4 w-4" />
          <span>{isEn ? 'English' : 'Tiếng Việt'}</span>
          <span className="ml-auto text-[10px] font-bold border px-1 rounded uppercase">
            {locale}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
