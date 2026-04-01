/**
 * Shared types dung chung cho tat ca service trong DAL.
 * Cac type nay doc lap voi Prisma generated types de tranh coupling.
 */

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export type ProductStatus = 'active' | 'out_of_stock';

export interface VariantSummary {
  id: number;
  productId: number;
  name: string;
  costPrice: number | null;
  price: number | null;
  unit: string | null;
  effectiveCostPrice: number;   // resolved from variant or product
  effectivePrice: number;       // resolved from variant or product
  effectiveUnit: string | null; // resolved from variant or product
  stockQty: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVariantInput {
  productId: number;
  name: string;
  costPrice?: number;
  price?: number;
  unit?: string;
}

export type UpdateVariantInput = Partial<Omit<CreateVariantInput, 'productId'>>;

export interface ProductSummary {
  id: number;
  name: string;
  shortDescription: string | null;
  brand: string | null;
  imageUrl: string | null;
  costPrice: number;
  price: number;
  stockQty: number;
  status: ProductStatus;
  categoryId: number;
  categoryName: string;
  providerId: number;
  providerName: string;
  inventoryId: number;
  inventoryName: string;
  unit: string | null;
  variants: VariantSummary[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  shortDescription?: string;
  description?: string;
  imageUrl?: string;
  brand?: string;
  costPrice: number;
  price: number;
  categoryId: number;
  providerId: number;
  inventoryId: number;
  unit?: string;
}

export type UpdateProductInput = Partial<CreateProductInput>;

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export interface InventorySummary {
  id: number;
  name: string;
  description: string | null;
  totalProducts: number;
  totalStockValue: number; // SUM(stockQty * costPrice)
  lowStockCount: number;
  outOfStockCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------

export type TransactionType = 'stock_in' | 'stock_out' | 'adjustment';

export type StockOutType = 'retail' | 'wholesale' | 'transfer';

export interface TransactionRecord {
  id: number;
  type: TransactionType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  note: string | null;
  productId: number;
  productName: string;
  userId: string;
  userName: string | null;
  variantId: number | null;
  variantName: string | null;
  stockOutType: StockOutType | null;
  salePrice: number | null;
  purchasePrice: number | null;
  isGift: boolean;
  parentTransactionId: number | null;
  returnTransactionId: number | null;
  createdAt: Date;
}

export interface CreateTransactionInput {
  type: TransactionType;
  quantity: number;
  note?: string;
  productId: number;
  variantId?: number;
  stockOutType?: StockOutType;
  salePrice?: number;
  purchasePrice?: number;
  isGift?: boolean;
  parentTransactionId?: number;
  userId: string;
}

export interface GiftItemInput {
  productId: number;
  variantId?: number;
  quantity: number;
}

export interface CreateStockOutInput extends CreateTransactionInput {
  gifts?: GiftItemInput[];
  debtorName?: string;
  paidAmount?: number;
}

// ---------------------------------------------------------------------------
// Return
// ---------------------------------------------------------------------------

export interface CreateReturnInput {
  productId: number;
  variantId?: number;
  returnQty: number;
  replacementQty: number;
  purchasePrice?: number;
  note?: string;
  userId: string;
}

export interface ReturnRecord {
  id: number;
  productId: number;
  productName: string;
  variantId: number | null;
  variantName: string | null;
  returnQty: number;
  replacementQty: number;
  note: string | null;
  userId: string;
  userName: string | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Debt
// ---------------------------------------------------------------------------

export type DebtStatus = 'open' | 'closed' | 'cancelled';

export interface DebtGroupSummary {
  id: number;
  transactionId: number;
  debtorName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number; // totalAmount - paidAmount
  status: DebtStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtGroupDetail extends DebtGroupSummary {
  payments: DebtPaymentRecord[];
}

export interface DebtPaymentRecord {
  id: number;
  amount: number;
  note: string | null;
  userId: string;
  userName: string | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

export type ActivityAction = 'create' | 'update' | 'delete' | 'export';

export interface ActivityLogRecord {
  id: number;
  action: ActivityAction;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  description: string;
  inventoryId: number | null;
  userId: string;
  userName: string | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalProducts: number;
  totalInventories: number;
  totalProviders: number;
  lowStockCount: number;
  outOfStockCount: number;
  // Tong gia tri ton kho = SUM(stockQty * costPrice) tren toan bo san pham
  totalStockValue: number;
  // Tien da thu thuc te (khong tinh transfer, gift, phan chua thanh toan cua debt)
  actualRevenue: number;
  // Tong salePrice cua tat ca stock_out retail/wholesale (ke ca chua thanh toan)
  estimatedRevenue: number;
  // Tong chi phi nhap hang = SUM(purchasePrice * quantity) cua cac giao dich stock_in
  totalCost: number;
  // Loi nhuan thuc te = actualRevenue - totalCost
  actualGrossProfit: number;
  // Loi nhuan uoc tinh = estimatedRevenue - totalCost
  estimatedGrossProfit: number;
  // So DebtGroup dang open
  openDebtCount: number;
  // Tong remaining cua cac DebtGroup open
  openDebtAmount: number;
  recentTransactions: TransactionRecord[];
  // Bieu do bien dong 7 ngay gan nhat
  dailyChart: { date: string; stockIn: number; stockOut: number; revenue: number }[];
  // Top 5 san pham ban chay
  topProducts: { productId: number; productName: string; soldQty: number; revenue: number }[];
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface ProviderSummary {
  id: number;
  name: string;
  totalProducts: number;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export interface CategorySummary {
  id: number;
  name: string;
  state: string;
  totalProducts: number;
  createdAt: Date;
  updatedAt: Date;
}
