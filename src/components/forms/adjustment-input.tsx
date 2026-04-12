'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdjustmentInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  'aria-invalid'?: boolean;
}

/**
 * Stepper input for stock adjustments.
 * - Minus button on the left, plus on the right
 * - Center shows the signed value with color:
 *   positive → green (+N), negative → red (−N), zero → muted (0)
 * - Tapping the center number makes it directly editable
 */
export function AdjustmentInput({
  value,
  onChange,
  disabled,
  'aria-invalid': ariaInvalid,
}: AdjustmentInputProps) {
  function decrement() {
    onChange(value - 1);
  }

  function increment() {
    onChange(value + 1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Allow empty, minus sign alone, or a valid integer
    if (raw === '' || raw === '-') {
      onChange(0);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) onChange(parsed);
  }

  const isPositive = value > 0;
  const isNegative = value < 0;

  const displayPrefix = isPositive ? '+' : '';

  return (
    <div
      className={cn(
        'flex items-center rounded-md border bg-background shadow-xs overflow-hidden',
        ariaInvalid && 'border-destructive ring-1 ring-destructive/20',
        disabled && 'opacity-50 pointer-events-none',
      )}
    >
      {/* Minus button */}
      <button
        type="button"
        onClick={decrement}
        disabled={disabled}
        className="flex items-center justify-center w-11 h-11 shrink-0 text-muted-foreground hover:bg-muted active:bg-muted/80 transition-colors border-r border-border"
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Value display / editable */}
      <div className="flex-1 flex items-center justify-center px-2">
        <input
          type="text"
          inputMode="numeric"
          value={value === 0 ? '0' : `${displayPrefix}${value}`}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            'w-full text-center text-lg font-semibold tabular-nums bg-transparent outline-none',
            isPositive && 'text-emerald-600 dark:text-emerald-400',
            isNegative && 'text-destructive',
            !isPositive && !isNegative && 'text-muted-foreground',
          )}
          // Select all on focus so user can type a new value directly
          onFocus={(e) => e.target.select()}
        />
      </div>

      {/* Plus button */}
      <button
        type="button"
        onClick={increment}
        disabled={disabled}
        className="flex items-center justify-center w-11 h-11 shrink-0 text-muted-foreground hover:bg-muted active:bg-muted/80 transition-colors border-l border-border"
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
