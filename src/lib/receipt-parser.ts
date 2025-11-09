import { parse, isValid } from 'date-fns';

/**
 * Receipt data parsing and formatting utilities
 */

/**
 * Parse receipt date from dd/mm/yy hh:mm:ss format
 * Example: "16/10/25 14:02:36"
 */
export function parseReceiptDate(dateString: string): Date | null {
  try {
    // Try parsing with 2-digit year first
    let parsedDate = parse(dateString, 'dd/MM/yy HH:mm:ss', new Date());
    
    if (isValid(parsedDate)) {
      return parsedDate;
    }

    // Try parsing with 4-digit year
    parsedDate = parse(dateString, 'dd/MM/yyyy HH:mm:ss', new Date());
    
    if (isValid(parsedDate)) {
      return parsedDate;
    }

    // Try without time component
    parsedDate = parse(dateString, 'dd/MM/yy', new Date());
    
    if (isValid(parsedDate)) {
      return parsedDate;
    }

    return null;
  } catch (error) {
    console.error('Error parsing receipt date:', error);
    return null;
  }
}

/**
 * Format ZWG currency for display
 * Example: 1580.99 -> "ZWG 1,580.99"
 */
export function formatZWG(amount: number): string {
  return `ZWG ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Calculate total ZWG amount from components
 */
export function calculateTotalZWG(
  energyCost: number,
  debt: number,
  rea: number,
  vat: number
): number {
  return energyCost + debt + rea + vat;
}

/**
 * Validate that total matches sum of components
 */
export function validateReceiptTotal(
  energyCost: number,
  debt: number,
  rea: number,
  vat: number,
  totalAmount: number
): { valid: boolean; calculatedTotal?: number; difference?: number } {
  const calculatedTotal = calculateTotalZWG(energyCost, debt, rea, vat);
  const difference = Math.abs(totalAmount - calculatedTotal);
  
  // Allow small floating point differences (up to 0.01)
  const valid = difference < 0.01;
  
  return {
    valid,
    calculatedTotal,
    difference,
  };
}

/**
 * Clean and parse token number (remove spaces)
 * Example: "6447 1068 4258 9659 8834" -> "6447106842589659883 4"
 */
export function cleanTokenNumber(token: string): string {
  return token.replace(/\s+/g, ' ').trim();
}

/**
 * Validate account number format (11 digits)
 */
export function isValidAccountNumber(accountNumber: string): boolean {
  // Account numbers should be 11 digits
  return /^\d{11}$/.test(accountNumber.replace(/\s+/g, ''));
}

/**
 * Calculate cost per kWh in ZWG
 */
export function calculateZWGPerKWh(totalAmountZWG: number, kwhPurchased: number): number {
  if (kwhPurchased <= 0) {
    return 0;
  }
  return totalAmountZWG / kwhPurchased;
}

/**
 * Calculate cost per kWh in USD
 */
export function calculateUSDPerKWh(totalPaymentUSD: number, kwhPurchased: number): number {
  if (kwhPurchased <= 0) {
    return 0;
  }
  return totalPaymentUSD / kwhPurchased;
}

/**
 * Calculate implied exchange rate from USD and ZWG amounts
 */
export function calculateImpliedExchangeRate(
  totalPaymentUSD: number,
  totalAmountZWG: number
): number {
  if (totalPaymentUSD <= 0) {
    return 0;
  }
  return totalAmountZWG / totalPaymentUSD;
}
