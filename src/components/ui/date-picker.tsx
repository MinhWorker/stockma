'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { vi, enUS, type DayPickerLocale } from 'react-day-picker/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const LOCALE_MAP: Record<string, DayPickerLocale> = {
  vi,
  en: enUS,
};

interface DatePickerProps {
  value?: string;       // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;         // YYYY-MM-DD
  max?: string;         // YYYY-MM-DD
  className?: string;
}

export function DatePicker({ value, onChange, placeholder, min, max, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const appLocale = useLocale();
  const locale = LOCALE_MAP[appLocale] ?? enUS;
  const defaultPlaceholder = appLocale === 'vi' ? 'Chọn ngày' : 'Pick a date';

  const selected = value ? new Date(value + 'T00:00:00') : undefined;
  const minDate = min ? new Date(min + 'T00:00:00') : undefined;
  const maxDate = max ? new Date(max + 'T00:00:00') : undefined;

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  }

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString(appLocale === 'vi' ? 'vi-VN' : 'en-US')
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-8 w-full justify-start text-left font-normal text-xs px-3',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0 opacity-60" />
          {displayValue ?? (placeholder ?? defaultPlaceholder)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          locale={locale}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
