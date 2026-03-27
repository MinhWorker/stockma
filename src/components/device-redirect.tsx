'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useDeviceType } from '@/hooks/use-device-type';

export function DeviceRedirect() {
  const device = useDeviceType();
  const router = useRouter();

  useEffect(() => {
    if (device === 'desktop') router.replace('/dashboard');
    else if (device === 'mobile') router.replace('/menu');
  }, [device, router]);

  return null;
}
