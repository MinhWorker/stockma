'use client';

import { ReactNode, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';

function ThemeCookieSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (resolvedTheme) {
      document.cookie = `theme=${resolvedTheme};path=/;max-age=31536000;SameSite=Lax`;
    }
  }, [resolvedTheme]);
  return null;
}

/**
 * With interactiveWidget=resizes-content, some Android browsers shrink the
 * layout viewport when the keyboard opens but don't restore it when it closes.
 * This effect forces a restore by tracking visualViewport height and syncing
 * it back to the document height when the keyboard closes.
 */
function KeyboardHeightFix() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function onResize() {
      // When keyboard closes, vv.height returns to full height.
      // Force the document to recalculate by briefly toggling a style.
      document.documentElement.style.minHeight = `${vv!.height}px`;
      requestAnimationFrame(() => {
        document.documentElement.style.minHeight = '';
      });
    }

    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  return null;
}

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeCookieSync />
      <KeyboardHeightFix />
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
