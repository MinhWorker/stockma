'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { ThemeToggle } from '@/components/theme-toggle';
import { LangSwitchButton } from '@/components/lang-switch-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import logo from '../../../../../public/web-app-manifest-192x192.png';
import { useSearchParams } from 'next/navigation';

const MENU_ROOT = '/menu';

export function MainHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isRoot = pathname === MENU_ROOT;
  const backTo = searchParams.get('back');

  function handleBack() {
    if (backTo) router.push(backTo as Parameters<typeof router.push>[0]);
    else router.push(MENU_ROOT);
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border min-h-[56px]">
      {/* Left: back button or logo */}
      {isRoot ? (
        <div className="flex items-center gap-2">
          <Image src={logo} alt="logo" height={28} width={28} className="shrink-0" />
          <span className="font-bold tracking-widest text-sm">STOCKMA</span>
        </div>
      ) : (
        <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        <LangSwitchButton className="h-8 text-xs px-2" />
        <ThemeToggle />
      </div>
    </header>
  );
}
