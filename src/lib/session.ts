import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { auth } from './auth';

/**
 * Get the current session, memoized per request via React cache().
 * Safe to call multiple times — only one auth lookup happens per request.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Get the current user or throw if not authenticated.
 * Use this in server actions that require an authenticated user.
 */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) throw new Error('Unauthorized');
  return session.user;
}
