'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FabProps {
  onClick: () => void;
  label?: string;
}

export function Fab({ onClick, label }: FabProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label ?? 'Thêm mới'}
      className={cn(
        'fixed bottom-20 right-4 z-50',
        'flex items-center gap-2 rounded-full shadow-lg',
        'bg-primary text-primary-foreground',
        'h-14 w-14 justify-center',
        'active:scale-95 transition-transform duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}
