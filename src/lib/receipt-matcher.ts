/**
 * Receipt Matcher
 * 
 * Matches imported receipt data to existing purchases using:
 * - Transaction date/time proximity
 * - kWh purchased fuzzy matching (±5% tolerance)
 * - Sequential purchase order validation
 * 
 * Returns match confidence scores to help identify potential matches.
 */

interface ReceiptRow {
  transactionDateTime: string; // dd/mm/yy hh:mm:ss format
  tokenNumber?: string;
  accountNumber?: string;
  kwhPurchased: number;
  energyCostZWG: number;
  debtZWG: number;
  reaZWG: number;
  vatZWG: number;
  totalAmountZWG: number;
  tenderedZWG: number;
}

interface Purchase {
  id: string;
  purchaseDate: string; // ISO format
  totalTokens: number; // kWh
  totalPayment: number; // USD
  meterReading: number;
  receiptData?: { id: string } | null;
}

interface MatchResult {
  receiptRow: ReceiptRow;
  matchedPurchase: Purchase | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  confidenceScore: number; // 0-100
  reasons: string[];
  warnings: string[];
}

/**
 * Parse dd/mm/yy hh:mm:ss format to ISO date
 */
function parseReceiptDateTime(dateTimeStr: string): Date | null {
  try {
    // Format: "16/10/25 14:02:36"
    const [datePart, timePart] = dateTimeStr.trim().split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    // Assume 2000s for 2-digit year
    const fullYear = year < 100 ? 2000 + year : year;

    return new Date(fullYear, month - 1, day, hour, minute, second);
  } catch {
    return null;
  }
}

/**
 * Calculate date difference in days
 */
function dateDiffInDays(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Calculate kWh match percentage
 */
function kwhMatchPercentage(receiptKwh: number, purchaseKwh: number): number {
  if (receiptKwh === 0 || purchaseKwh === 0) return 0;
  const diff = Math.abs(receiptKwh - purchaseKwh);
  const avg = (receiptKwh + purchaseKwh) / 2;
  return Math.max(0, 100 - (diff / avg) * 100);
}

/**
 * Match a single receipt row to available purchases
 */
export function matchReceiptToPurchase(
  receiptRow: ReceiptRow,
  purchases: Purchase[]
): MatchResult {
  const result: MatchResult = {
    receiptRow,
    matchedPurchase: null,
    confidence: 'none',
    confidenceScore: 0,
    reasons: [],
    warnings: [],
  };

  // Parse receipt date
  const receiptDate = parseReceiptDateTime(receiptRow.transactionDateTime);
  if (!receiptDate) {
    result.warnings.push('Invalid transaction date format');
    return result;
  }

  // Filter to purchases without existing receipt data
  const availablePurchases = purchases.filter((p) => !p.receiptData);

  if (availablePurchases.length === 0) {
    result.warnings.push('No purchases available for matching (all have receipts)');
    return result;
  }

  // Score each purchase
  let bestMatch: Purchase | null = null;
  let bestScore = 0;
  const matchReasons: string[] = [];

  for (const purchase of availablePurchases) {
    const purchaseDate = new Date(purchase.purchaseDate);
    const dateDiff = dateDiffInDays(receiptDate, purchaseDate);
    const kwhMatch = kwhMatchPercentage(receiptRow.kwhPurchased, purchase.totalTokens);

    let score = 0;
    const reasons: string[] = [];

    // Date matching (within 7 days = up to 50 points)
    if (dateDiff <= 1) {
      score += 50;
      reasons.push('Exact date match');
    } else if (dateDiff <= 3) {
      score += 35;
      reasons.push(`Close date match (${dateDiff.toFixed(1)} days apart)`);
    } else if (dateDiff <= 7) {
      score += 20;
      reasons.push(`Nearby date (${dateDiff.toFixed(1)} days apart)`);
    }

    // kWh matching (>95% match = up to 50 points)
    if (kwhMatch >= 99) {
      score += 50;
      reasons.push('Exact kWh match');
    } else if (kwhMatch >= 95) {
      score += 40;
      reasons.push(`Very close kWh match (${kwhMatch.toFixed(1)}%)`);
    } else if (kwhMatch >= 90) {
      score += 25;
      reasons.push(`Close kWh match (${kwhMatch.toFixed(1)}%)`);
    } else if (kwhMatch >= 80) {
      score += 10;
      reasons.push(`Approximate kWh match (${kwhMatch.toFixed(1)}%)`);
    }

    // Update best match
    if (score > bestScore) {
      bestScore = score;
      bestMatch = purchase;
      matchReasons.length = 0;
      matchReasons.push(...reasons);
    }
  }

  // Determine confidence level
  if (bestScore >= 80) {
    result.confidence = 'high';
    result.matchedPurchase = bestMatch;
    result.reasons = matchReasons;
  } else if (bestScore >= 50) {
    result.confidence = 'medium';
    result.matchedPurchase = bestMatch;
    result.reasons = matchReasons;
    result.warnings.push('Match confidence is medium - please verify');
  } else if (bestScore >= 20) {
    result.confidence = 'low';
    result.matchedPurchase = bestMatch;
    result.reasons = matchReasons;
    result.warnings.push('Match confidence is low - manual verification recommended');
  } else {
    result.confidence = 'none';
    result.warnings.push('No suitable purchase found - may need to create new purchase');
  }

  result.confidenceScore = Math.round(bestScore);

  return result;
}

/**
 * Match multiple receipt rows to purchases
 */
export function matchReceiptsToPurchases(
  receiptRows: ReceiptRow[],
  purchases: Purchase[]
): MatchResult[] {
  const results: MatchResult[] = [];
  const usedPurchaseIds = new Set<string>();

  // Sort receipts by date (oldest first)
  const sortedReceipts = [...receiptRows].sort((a, b) => {
    const dateA = parseReceiptDateTime(a.transactionDateTime);
    const dateB = parseReceiptDateTime(b.transactionDateTime);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });

  // Match each receipt
  for (const receipt of sortedReceipts) {
    // Filter out already matched purchases
    const availablePurchases = purchases.filter(
      (p) => !usedPurchaseIds.has(p.id)
    );

    const match = matchReceiptToPurchase(receipt, availablePurchases);

    // If high confidence match, mark purchase as used
    if (match.confidence === 'high' && match.matchedPurchase) {
      usedPurchaseIds.add(match.matchedPurchase.id);
    }

    results.push(match);
  }

  return results;
}

/**
 * Validate receipt row data
 */
export function validateReceiptRow(
  row: Partial<ReceiptRow>,
  rowNumber: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!row.transactionDateTime) {
    errors.push(`Row ${rowNumber}: Transaction date/time is required`);
  } else if (!parseReceiptDateTime(row.transactionDateTime)) {
    errors.push(
      `Row ${rowNumber}: Invalid date format (expected dd/mm/yy hh:mm:ss)`
    );
  }

  if (row.kwhPurchased === undefined || row.kwhPurchased === null) {
    errors.push(`Row ${rowNumber}: kWh Purchased is required`);
  } else if (row.kwhPurchased <= 0) {
    errors.push(`Row ${rowNumber}: kWh Purchased must be positive`);
  }

  if (row.energyCostZWG === undefined || row.energyCostZWG === null) {
    errors.push(`Row ${rowNumber}: Energy Cost is required`);
  } else if (row.energyCostZWG < 0) {
    errors.push(`Row ${rowNumber}: Energy Cost cannot be negative`);
  }

  if (row.totalAmountZWG === undefined || row.totalAmountZWG === null) {
    errors.push(`Row ${rowNumber}: Total Amount is required`);
  } else if (row.totalAmountZWG <= 0) {
    errors.push(`Row ${rowNumber}: Total Amount must be positive`);
  }

  if (row.tenderedZWG === undefined || row.tenderedZWG === null) {
    errors.push(`Row ${rowNumber}: Amount Tendered is required`);
  } else if (row.tenderedZWG <= 0) {
    errors.push(`Row ${rowNumber}: Amount Tendered must be positive`);
  }

  // Default optional fields to 0 if not provided
  if (row.debtZWG === undefined || row.debtZWG === null) {
    row.debtZWG = 0;
  }
  if (row.reaZWG === undefined || row.reaZWG === null) {
    row.reaZWG = 0;
  }
  if (row.vatZWG === undefined || row.vatZWG === null) {
    row.vatZWG = 0;
  }

  // Validate totals
  if (
    row.energyCostZWG !== undefined &&
    row.debtZWG !== undefined &&
    row.reaZWG !== undefined &&
    row.vatZWG !== undefined &&
    row.totalAmountZWG !== undefined
  ) {
    const calculatedTotal =
      row.energyCostZWG + row.debtZWG + row.reaZWG + row.vatZWG;
    const diff = Math.abs(calculatedTotal - row.totalAmountZWG);
    if (diff > 0.02) {
      errors.push(
        `Row ${rowNumber}: Total mismatch (calculated: ${calculatedTotal.toFixed(2)}, entered: ${row.totalAmountZWG.toFixed(2)})`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
