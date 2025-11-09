/**
 * Receipt Data Types
 * 
 * Types and interfaces for electricity provider receipt data
 * captured from official ZWG currency receipts.
 */

/**
 * Receipt Data from electricity provider
 * All currency amounts in ZWG (Zimbabwean Gold)
 */
export interface ReceiptData {
  id: string;
  purchaseId: string;
  tokenNumber: string | null;
  accountNumber: string | null;
  kwhPurchased: number;
  energyCostZWG: number;
  debtZWG: number;
  reaZWG: number; // Regulatory Energy Authority levy
  vatZWG: number;
  totalAmountZWG: number;
  tenderedZWG: number;
  transactionDateTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Receipt data for creation (without generated fields)
 */
export interface CreateReceiptDataInput {
  purchaseId: string;
  tokenNumber?: string | null;
  accountNumber?: string | null;
  kwhPurchased: number;
  energyCostZWG: number;
  debtZWG: number;
  reaZWG: number;
  vatZWG: number;
  totalAmountZWG: number;
  tenderedZWG: number;
  transactionDateTime: Date | string; // Can accept string for parsing
}

/**
 * Receipt data for updates (all fields optional except ID)
 */
export interface UpdateReceiptDataInput {
  tokenNumber?: string | null;
  accountNumber?: string | null;
  kwhPurchased?: number;
  energyCostZWG?: number;
  debtZWG?: number;
  reaZWG?: number;
  vatZWG?: number;
  totalAmountZWG?: number;
  tenderedZWG?: number;
  transactionDateTime?: Date | string;
}

/**
 * Receipt data with related purchase information
 */
export interface ReceiptDataWithPurchase extends ReceiptData {
  purchase: {
    id: string;
    totalTokens: number;
    totalPayment: number;
    meterReading: number;
    purchaseDate: Date;
    isEmergency: boolean;
  };
}

/**
 * Parsed receipt data from CSV import
 */
export interface ParsedReceiptData {
  // Receipt fields
  tokenNumber?: string;
  accountNumber?: string;
  kwhPurchased: number;
  energyCostZWG: number;
  debtZWG: number;
  reaZWG: number;
  vatZWG: number;
  totalAmountZWG: number;
  tenderedZWG: number;
  transactionDateTime: string; // dd/mm/yyyy hh:mm:ss format
  
  // Matching fields (to find corresponding purchase)
  matchDate?: string; // For matching to purchase by date
  matchMeterReading?: number; // For matching to purchase by meter reading
  
  // Matching result
  matchedPurchaseId?: string;
  matchConfidence?: 'high' | 'medium' | 'low' | 'none';
  matchReason?: string;
}

/**
 * Bulk import result for single receipt
 */
export interface ReceiptImportResult {
  success: boolean;
  receiptData: ParsedReceiptData;
  matchedPurchaseId?: string;
  error?: string;
  warning?: string;
}

/**
 * Summary of bulk import operation
 */
export interface BulkImportSummary {
  totalRecords: number;
  successful: number;
  failed: number;
  warnings: number;
  results: ReceiptImportResult[];
  errors: string[];
}

/**
 * Cost breakdown using receipt data
 */
export interface ReceiptCostAnalysis {
  zwgCostPerKwh: number;
  usdCostPerKwh: number; // If exchange rate available
  exchangeRate?: number;
  energyPercentage: number; // % of total that is energy cost
  debtPercentage: number;
  reaPercentage: number;
  vatPercentage: number;
  effectiveRate: number; // Total cost / kWh
}

/**
 * Historical pricing trends from receipt data
 */
export interface PricingTrend {
  period: string; // e.g., "2025-10", "2025-Q3"
  averageZwgPerKwh: number;
  lowestZwgPerKwh: number;
  highestZwgPerKwh: number;
  totalPurchases: number;
  totalKwh: number;
  totalAmountZWG: number;
}

/**
 * Insights from historical analysis
 */
export interface HistoricalInsights {
  overallTrend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number; // % change over period
  seasonalPattern: boolean;
  anomalies: Array<{
    date: Date;
    zwgPerKwh: number;
    deviationPercentage: number;
    reason?: string;
  }>;
  recommendations: string[];
}
