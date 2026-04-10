'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface MobileSelectSheetProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  title?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
}

export function MobileSelectSheet({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  title = 'Chọn',
  searchPlaceholder = 'Tìm kiếm...',
  emptyText = 'Không tìm thấy',
  disabled,
  'aria-invalid': ariaInvalid,
}: MobileSelectSheetProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch('');
  }

  return (
    <>
      {/* Trigger button — looks like a select */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={cn(
          'border-input bg-background ring-offset-background flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow]',
          'focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          ariaInvalid && 'border-destructive ring-destructive/20',
          !selected && 'text-muted-foreground',
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {/* Bottom sheet */}
      <Drawer open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(''); }}>
        <DrawerContent className="max-h-[75vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>

          {/* Search */}
          <div className="relative px-4 pb-2">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1 pb-safe">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-sm text-left active:bg-muted transition-colors"
                  >
                    <span>{opt.label}</span>
                    {opt.value === value && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
