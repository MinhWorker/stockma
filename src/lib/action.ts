import 'server-only';
import { requireUser } from './session';
import type { Session } from './auth';

type User = Session['user'];

/**
 * Wraps a server action with automatic user injection.
 * The callback receives the authenticated user as its first argument.
 *
 * @example
 * export const createProviderAction = withUser(async (user, data: { name: string }) => {
 *   await createProvider({ ...data, createdBy: user.id });
 *   await logActivity({ userId: user.id, action: 'CREATE_PROVIDER' });
 * });
 */
export function withUser<TArgs extends unknown[], TReturn>(
  fn: (user: User, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    const user = await requireUser();
    return fn(user, ...args);
  };
}
