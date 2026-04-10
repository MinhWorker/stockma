'use client';

import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PriceInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  value: number | string;
  onChange: (value: number) => void;
}

function toDisplay(raw: number | string): string {
  const n = typeof raw === 'string' ? parseFloat(raw.replace(/,/g, '')) : raw;
  if (!n && n !== 0) return '';
  return n.toLocaleString('en-US');
}

/**
 * Number input with live thousand-separator formatting (1000 → 1,000 while typing).
 * Maintains correct cursor position after inserting commas.
 */
export function PriceInput({ value, onChange, className, ...props }: PriceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const display = toDisplay(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const raw = el.value.replace(/[^0-9]/g, ''); // digits only

    // Count digits before cursor in the old value
    const cursorPos = el.selectionStart ?? 0;
    const digitsBeforeCursor = el.value.slice(0, cursorPos).replace(/[^0-9]/g, '').length;

    const num = parseInt(raw, 10) || 0;
    const formatted = raw ? num.toLocaleString('en-US') : '';

    onChange(num);

    // Restore cursor: find position after digitsBeforeCursor digits in new formatted string
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      let count = 0;
      let newPos = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/[0-9]/.test(formatted[i])) count++;
        if (count === digitsBeforeCursor) { newPos = i + 1; break; }
      }
      // If we typed at the end, put cursor at end
      if (digitsBeforeCursor >= raw.length) newPos = formatted.length;
      inputRef.current.setSelectionRange(newPos, newPos);
    });
  }

  return (
    <Input
      {...props}
      ref={inputRef}
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      className={cn(className)}
    />
  );
}
