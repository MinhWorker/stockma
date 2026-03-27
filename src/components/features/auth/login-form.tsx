'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LangSwitchButton } from '@/components/lang-switch-button';
import { type LocalAccount, syncLocalAccounts, saveLocalAccount, setSession } from '@/lib/auth';

type Mode = 'loading' | 'pick' | 'create';

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('loading');
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingAccount, setExistingAccount] = useState<LocalAccount | null>(null);

  useEffect(() => {
    syncLocalAccounts().then((saved) => {
      setAccounts(saved);
      setMode(saved.length > 0 ? 'pick' : 'create');
    });
  }, []);

  function loginAs(account: LocalAccount) {
    setSession(account.id);
    router.push('/dashboard');
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t('emptyEmail'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t('invalidEmail'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, name: name.trim() || undefined }),
      });
      if (res.status === 409) {
        const { user } = await res.json();
        setExistingAccount(user);
        setError(t('emailTaken'));
        return;
      }
      if (!res.ok) {
        setError(t('createError'));
        return;
      }
      const user: LocalAccount = await res.json();
      saveLocalAccount(user);
      setSession(user.id);
      router.push('/dashboard');
    } catch {
      setError(t('createError'));
    } finally {
      setIsLoading(false);
    }
  }

  if (mode === 'loading') return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <LangSwitchButton className="absolute top-4 right-4" />
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {mode === 'pick' ? t('welcomeBack') : t('createAccountTitle')}
          </CardTitle>
          <CardDescription>
            {mode === 'pick' ? t('pickAccountDescription') : t('createAccountDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'pick' && (
            <>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => loginAs(account)}
                    className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left hover:bg-accent transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {(account.name ?? account.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      {account.name && (
                        <p className="truncate text-sm font-medium">{account.name}</p>
                      )}
                      <p className="truncate text-sm text-muted-foreground">{account.email}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMode('create');
                  setEmail('');
                  setName('');
                  setError('');
                }}
              >
                {t('addAccount')}
              </Button>
            </>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('email')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setExistingAccount(null);
                    setError('');
                  }}
                  autoComplete="email"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('name')}{' '}
                  <span className="text-muted-foreground text-xs">({t('optional')})</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              {existingAccount && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    saveLocalAccount(existingAccount);
                    loginAs(existingAccount);
                  }}
                >
                  {t('loginAsExisting', { email: existingAccount.email })}
                </Button>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('creating') : t('createAccount')}
              </Button>
              {accounts.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setMode('pick');
                    setError('');
                  }}
                >
                  {t('backToAccounts')}
                </Button>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
