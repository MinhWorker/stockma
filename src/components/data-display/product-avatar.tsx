'use client';

import Image from 'next/image';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildCloudinaryImageUrl } from '@/lib/cloudinary-image';

interface ProductAvatarProps {
  name: string;
  imageUrl?: string | null;
  categoryName?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: { box: 'h-9 w-9 rounded-lg', image: 72, text: 'text-[10px]' },
  md: { box: 'h-10 w-10 rounded-xl', image: 80, text: 'text-xs' },
  lg: { box: 'h-14 w-14 rounded-xl', image: 112, text: 'text-sm' },
  xl: { box: 'h-24 w-24 rounded-2xl', image: 192, text: 'text-xl' },
};

function initials(name: string, categoryName?: string | null) {
  const value = name.trim() || categoryName?.trim() || '';
  if (!value) return null;
  return value.slice(0, 2).toUpperCase();
}

export function ProductAvatar({
  name,
  imageUrl,
  categoryName,
  size = 'md',
  className,
}: ProductAvatarProps) {
  const config = sizes[size];
  const src = buildCloudinaryImageUrl(imageUrl, { width: config.image, height: config.image });

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden bg-muted font-bold uppercase text-muted-foreground',
        config.box,
        config.text,
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={config.image}
          height={config.image}
          className="h-full w-full object-cover"
          sizes={`${config.image}px`}
        />
      ) : (
        initials(name, categoryName) ?? <Package className="h-4 w-4" />
      )}
    </div>
  );
}
