/**
 * Shared validation helpers for service-layer business rules.
 * Throws Error with a descriptive message on violation.
 */

export function requireNonEmpty(value: string | undefined | null, field: string): void {
  if (!value || !value.trim()) throw new Error(`${field} is required`);
}

export function requirePositive(value: number | undefined | null, field: string): void {
  if (value === undefined || value === null || value <= 0)
    throw new Error(`${field} must be greater than 0`);
}

export function requireNonNegative(value: number | undefined | null, field: string): void {
  if (value === undefined || value === null || value < 0)
    throw new Error(`${field} must be 0 or greater`);
}
