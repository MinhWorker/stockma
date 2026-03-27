export type TransactionType = 'stock_in' | 'stock_out' | 'adjustment';

export interface Transaction {
  id: number;
  type: TransactionType;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note: string;
  userId: number;
  userName: string;
  createdAt: string;
}

export interface TransactionFormValues {
  type: TransactionType;
  productId: number;
  quantity: number;
  note: string;
}
