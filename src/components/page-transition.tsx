import { ViewTransition } from 'react';
import type { ReactNode } from 'react';

/**
 * Wraps page content with view transitions.
 * - Directional slide when navigating forward/back (from ActionCards)
 * - Crossfade (browser default) when navigating laterally (bottom nav tabs)
 * Place as the outermost element in each page — not in layouts.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'auto' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'auto' }}
    >
      {children}
    </ViewTransition>
  );
}
