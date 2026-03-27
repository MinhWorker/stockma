import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: t('appName'),
    description: t('appDescription'),
    icons: {
      icon: '/favicon-96x96.png',
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
  };
}
