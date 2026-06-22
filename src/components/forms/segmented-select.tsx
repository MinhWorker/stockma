'use client';

import { cn } from '@/lib/utils';

interface SegmentedSelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface SegmentedSelectProps<T extends string> {
  value: T | '';
  options: SegmentedSelectOption<T>[];
  onValueChange: (value: T) => void;
  'aria-label': string;
  error?: boolean;
  className?: string;
}

export function SegmentedSelect<T extends string>({
  value,
  options,
  onValueChange,
  'aria-label': ariaLabel,
  error,
  className,
}: SegmentedSelectProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'grid gap-1 rounded-xl border bg-muted/50 p-1',
        options.length <= 3 ? 'grid-cols-3' : 'grid-cols-2',
        error && 'border-destructive',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'min-h-11 rounded-lg px-2 py-2 text-center text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
            )}
          >
            <span className="block leading-tight">{option.label}</span>
            {option.description && (
              <span className="mt-0.5 block text-[11px] font-normal leading-tight text-muted-foreground">
                {option.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
