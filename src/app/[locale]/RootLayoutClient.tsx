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

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      scriptProps={{ suppressHydrationWarning: true }}
    >
      <ThemeCookieSync />
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
