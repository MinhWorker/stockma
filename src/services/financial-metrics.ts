type DebtGroupPayment = {
  paidAmount: number;
} | null;

type CostSource = {
  costPrice?: number | null;
} | null;

export type SaleTransactionForMetrics = {
  quantity: number;
  salePrice: number | null;
  purchasePrice?: number | null;
  product?: CostSource;
  variant?: CostSource;
  debtGroup: DebtGroupPayment;
};

export type SalesFinancialMetrics = {
  estimatedRevenue: number;
  actualRevenue: number;
  estimatedGrossProfit: number;
  actualGrossProfit: number;
};

function resolveUnitCost(tx: SaleTransactionForMetrics): number {
  return tx.purchasePrice ?? tx.variant?.costPrice ?? tx.product?.costPrice ?? 0;
}

export function calculateSalesFinancialMetrics(
  saleTransactions: SaleTransactionForMetrics[]
): SalesFinancialMetrics {
  let estimatedRevenue = 0;
  let actualRevenue = 0;
  let estimatedGrossProfit = 0;
  let actualGrossProfit = 0;

  for (const tx of saleTransactions) {
    const quantity = Math.abs(tx.quantity);
    const saleAmount = (tx.salePrice ?? 0) * quantity;
    const soldCost = resolveUnitCost(tx) * quantity;
    const collectedAmount = tx.debtGroup ? tx.debtGroup.paidAmount : saleAmount;

    estimatedRevenue += saleAmount;
    actualRevenue += collectedAmount;
    estimatedGrossProfit += saleAmount - soldCost;
    actualGrossProfit += collectedAmount - soldCost;
  }

  return {
    estimatedRevenue,
    actualRevenue,
    estimatedGrossProfit,
    actualGrossProfit,
  };
}
