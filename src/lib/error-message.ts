'use client';

const ERROR_KEY_MAP: Record<string, string> = {
  ERR_INSUFFICIENT_STOCK: 'errInsufficientStock',
  ERR_HAS_PRODUCTS: 'errHasProducts',
  ERR_HAS_TRANSACTIONS: 'errHasTransactions',
  ERR_PRICE_BELOW_COST: 'errPriceBelowCost',
  ERR_VARIANT_DUPLICATE_NAME: 'errVariantDuplicateName',
  ERR_VARIANT_HAS_TRANSACTIONS: 'errVariantHasTransactions',
  ERR_VARIANT_REQUIRED: 'errVariantRequired',
  ERR_DEBT_ALREADY_CLOSED: 'errDebtAlreadyClosed',
  ERR_INVALID_PAYMENT_AMOUNT: 'errInvalidPaymentAmount',
  ERR_RETURN_QTY_INVALID: 'errReturnQtyInvalid',
};

/**
 * Maps a server error code to a key in the 'common' namespace.
 * Falls back to 'error' for unrecognized messages.
 */
export function getErrorKey(error: string | undefined): string {
  if (!error) return 'error';
  return ERROR_KEY_MAP[error] ?? 'error';
}
