'use client';

import NextLink, { type LinkProps } from 'next/link';
import { useLocale } from 'next-intl';
import type { AnchorHTMLAttributes } from 'react';

type LocaleLinkProps = Omit<LinkProps, 'href'> &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const locale = useLocale();
  const localizedHref = href.startsWith('/') ? `/${locale}${href}` : href;
  return <NextLink href={localizedHref} {...props} />;
}
