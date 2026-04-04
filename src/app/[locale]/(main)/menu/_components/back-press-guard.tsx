'use client';

import { useBackPressToExit } from '@/hooks/use-back-press-to-exit';

export function BackPressGuard({ message }: { message?: string }) {
  useBackPressToExit(message);
  return null;
}
