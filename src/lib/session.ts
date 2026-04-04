import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { auth } from './auth';

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}
