'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

const TOAST_ID = 'back-press-exit';
const WINDOW_MS = 2000;

export function useBackPressToExit(message = 'Press again to close app') {
  useEffect(() => {
    window.history.pushState({ backPressGuard: true }, '');

    let pressedOnce = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onPopState = () => {
      if (pressedOnce) {
        toast.dismiss(TOAST_ID);
        if (timer) clearTimeout(timer);
        window.history.go(-(window.history.length));
        return;
      }

      pressedOnce = true;
      window.history.pushState({ backPressGuard: true }, '');
      toast(message, { id: TOAST_ID, duration: WINDOW_MS });

      timer = setTimeout(() => {
        pressedOnce = false;
        toast.dismiss(TOAST_ID);
      }, WINDOW_MS);
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (timer) clearTimeout(timer);
    };
  }, [message]);
}
