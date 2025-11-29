import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatZWG(amount: number): string {
  return `ZWG ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

export function calculateTrueCost(
  tokensUsed: number,
  totalTokens: number,
  totalCost: number
): number {
  if (totalTokens === 0) return 0;
  return (tokensUsed / totalTokens) * totalCost;
}

export function calculateEfficiency(
  amountPaid: number,
  trueCost: number
): number {
  if (trueCost === 0) return 0;
  return (amountPaid / trueCost) * 100;
}

/**
 * Universal date formatter - handles all date formats and prevents timezone shifts
 * Returns format: DD/MM/YYYY
 *
 * Handles:
 * - ISO date strings: "2025-11-25"
 * - ISO datetime strings: "2025-11-25T06:12:45.000Z"
 * - Date objects
 *
 * @param dateInput - Date string, Date object, or null/undefined
 * @returns Formatted date string in DD/MM/YYYY format, or "Invalid Date" if parsing fails
 */
export function formatDisplayDate(
  dateInput: string | Date | null | undefined
): string {
  if (!dateInput) return 'Invalid Date';

  try {
    let date: Date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      // Check if it's a date-only string (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        // Append T00:00:00 to prevent timezone shift
        date = new Date(dateInput + 'T00:00:00');
      } else {
        // Full datetime string
        date = new Date(dateInput);
      }
    } else {
      return 'Invalid Date';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Manually format as DD/MM/YYYY to ensure consistent formatting
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format date and time for display
 * Returns format: MM/DD/YYYY, HH:MM:SS AM/PM
 *
 * @param dateInput - Date string or Date object
 * @returns Formatted datetime string
 */
export function formatDisplayDateTime(
  dateInput: string | Date | null | undefined
): string {
  if (!dateInput) return 'Invalid Date';

  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid Date';
  }
}

// Legacy aliases for backward compatibility
export const formatPurchaseDate = formatDisplayDate;
export const formatLocalDate = formatDisplayDate;
export const formatLocalDateTime = formatDisplayDateTime;
