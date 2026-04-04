import { ViewTransition } from 'react';
import type { ReactNode } from 'react';

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
