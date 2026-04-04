'use client';

import NextLink, { type LinkProps } from 'next/link';
import { useLocale } from 'next-intl';
import type { AnchorHTMLAttributes } from 'react';

type LocaleLinkProps = Omit<LinkProps, 'href'> &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

/**
 * Drop-in replacement for next-intl's Link that also supports
 * Next.js 16.2+ props like `transitionTypes`.
 * Automatically prepends the current locale to the href.
 */
export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const locale = useLocale();
  const localizedHref = href.startsWith('/') ? `/${locale}${href}` : href;

  return <NextLink href={localizedHref} {...props} />;
}
