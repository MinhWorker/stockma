import 'server-only';
import { requireUser } from './session';
import type { Session } from './auth';

type User = Session['user'];

export function withUser<TArgs extends unknown[], TReturn>(
  fn: (user: User, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    const user = await requireUser();
    return fn(user, ...args);
  };
}
