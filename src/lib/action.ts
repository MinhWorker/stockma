import 'server-only';
import { requireUser } from './session';
import type { Session } from './auth';

type User = Session['user'];

export function withUser<TArgs extends unknown[], TReturn extends { success: boolean; error?: string }>(
  fn: (user: User, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn | { success: false; error: string }> {
  return async (...args: TArgs) => {
    try {
      const user = await requireUser();
      return fn(user, ...args);
    } catch {
      return { success: false, error: 'Unauthorized' };
    }
  };
}
