'use client';

const ERROR_KEY_MAP: Record<string, string> = {
  ERR_INSUFFICIENT_STOCK: 'errInsufficientStock',
  ERR_HAS_PRODUCTS: 'errHasProducts',
  ERR_HAS_TRANSACTIONS: 'errHasTransactions',
  ERR_PRICE_BELOW_COST: 'errPriceBelowCost',
};

/**
 * Maps a server error code to a key in the 'common' namespace.
 * Falls back to 'error' for unrecognized messages.
 */
export function getErrorKey(error: string | undefined): string {
  if (!error) return 'error';
  return ERROR_KEY_MAP[error] ?? 'error';
}
