/**
 * Shared types dung chung cho tat ca service trong DAL.
 * Cac type nay doc lap voi Prisma generated types de tranh coupling.
 */

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock';

export interface ProductSummary {
  id: number;
  name: string;
  shortDescription: string | null;
  brand: string | null;
  imageUrl: string | null;
  costPrice: number;
  price: number;
  reorderLevel: number;
  stockQty: number;
  status: ProductStatus;
  categoryId: number;
  categoryName: string;
  providerId: number;
  providerName: string;
  inventoryId: number;
  inventoryName: string;
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
  reorderLevel?: number;
  categoryId: number;
  providerId: number;
  inventoryId: number;
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
  createdAt: Date;
}

export interface CreateTransactionInput {
  type: TransactionType;
  quantity: number;
  note?: string;
  productId: number;
  userId: string;
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
  // Doanh thu = SUM(|quantity| * price) cua cac giao dich stock_out
  totalRevenue: number;
  // Tong chi phi nhap hang = SUM(|quantity| * costPrice) cua cac giao dich stock_in
  totalCost: number;
  // Loi nhuan = totalRevenue - totalCost
  grossProfit: number;
  recentTransactions: TransactionRecord[];
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
