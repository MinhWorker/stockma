import React from 'react';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';
import '../globals.css';
import { cn } from '@/lib/utils';
import RootLayoutClient from './RootLayoutClient';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'vietnamese'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'vi')) {
    notFound();
  }

  const messages = await getMessages();

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme')?.value;
  const themeClass = themeCookie === 'dark' ? 'dark' : '';

  return (
    <html lang={locale} className={themeClass} suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.variable)}>
        <NextIntlClientProvider messages={messages}>
          <RootLayoutClient>{children}</RootLayoutClient>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
