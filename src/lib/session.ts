import 'server-only';
import { headers } from 'next/headers';
import { auth } from './auth';

/**
 * Get the current session in Server Components / Server Actions.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Get the current user or throw if not authenticated.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}
