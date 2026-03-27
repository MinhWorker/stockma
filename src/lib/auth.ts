const ACCOUNTS_KEY = 'app_accounts';
const SESSION_KEY = 'app_session_user_id';

export interface LocalAccount {
  id: number;
  email: string;
  name: string | null;
}

export function getLocalAccounts(): LocalAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export async function syncLocalAccounts(): Promise<LocalAccount[]> {
  const accounts = getLocalAccounts();
  if (accounts.length === 0) return [];

  const ids = accounts.map((a) => a.id).join(',');
  const res = await fetch(`/api/auth?ids=${ids}`);
  if (!res.ok) return accounts; // fail gracefully, keep local list

  const validIds: number[] = await res.json();
  const synced = accounts.filter((a) => validIds.includes(a.id));
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(synced));
  return synced;
}

export function saveLocalAccount(account: LocalAccount): void {
  const accounts = getLocalAccounts();
  const exists = accounts.findIndex((a) => a.id === account.id);
  if (exists >= 0) {
    accounts[exists] = account;
  } else {
    accounts.push(account);
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function setSession(userId: number): void {
  sessionStorage.setItem(SESSION_KEY, String(userId));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSessionUserId(): number | null {
  const v = sessionStorage.getItem(SESSION_KEY);
  return v ? Number(v) : null;
}

export function isAuthenticated(): boolean {
  return getSessionUserId() !== null;
}
