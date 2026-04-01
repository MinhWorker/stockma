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
// Price formatting
// ---------------------------------------------------------------------------

/**
 * Format VND price: "1.234.567đ"
 */
export function formatPrice(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}
