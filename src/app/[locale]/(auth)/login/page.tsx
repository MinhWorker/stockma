import { getTranslations } from 'next-intl/server';
import { LoginForm } from './_components/login-form';

export default async function LoginPage() {
  const t = await getTranslations('auth');
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">StockMa</h1>
          <p className="text-sm text-muted-foreground">{t('loginSubtitle')}</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
