'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // next-themes 0.4.x injects a <script> for FOUC prevention which triggers a
  // React 19 console warning. Since we already apply the theme class server-side
  // via cookie, this script is redundant. Suppress the warning until next-themes
  // ships a fix using <template> instead.
  const originalError = React.useRef(console.error);
  React.useEffect(() => {
    const orig = console.error.bind(console);
    originalError.current = orig;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('script')) return;
      orig(...args);
    };
    return () => { console.error = originalError.current; };
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
