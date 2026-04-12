import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Date formatting — always use explicit locale + hour12:false to avoid
// hydration mismatches between Node.js (server) and browser locales.
// ---------------------------------------------------------------------------

/**
 * Relative label for card timestamps:
 * - Same day  → "18:32"
 * - Yesterday → "Hôm qua"
 * - < 7 days  → "N ngày trước"
 * - Older     → "dd/mm"
 */
export function formatRelativeDate(d: Date | string): string {
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

/**
 * Full datetime for detail views: "dd/mm/yyyy, hh:mm"
 */
export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Short date for list group headers: month + year label
 */
export function formatMonthYear(d: Date | string): string {
  return new Date(d).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

/**
 * Short date: "dd/mm/yyyy"
 */
export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('vi-VN');
}

// ---------------------------------------------------------------------------
// Date parsing — canonical helpers for converting ISO date strings (YYYY-MM-DD)
// to Date objects. Always append explicit time to avoid UTC-vs-local ambiguity:
// new Date("2025-04-12") → UTC midnight (wrong in UTC+7)
// new Date("2025-04-12T00:00:00") → local midnight (correct)
// ---------------------------------------------------------------------------

/**
 * Parse a YYYY-MM-DD string as the start of that day in local time (00:00:00).
 */
export function parseDateStart(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/**
 * Parse a YYYY-MM-DD string as the end of that day in local time (23:59:59).
 */
export function parseDateEnd(dateStr: string): Date {
  return new Date(dateStr + 'T23:59:59');
}



/**
 * Format VND price: "1.234.567đ"
 */
export function formatPrice(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}
