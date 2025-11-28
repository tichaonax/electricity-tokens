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
 * Format a date string (YYYY-MM-DD) to local date without timezone shift
 * Returns format: MM/DD/YYYY
 * @param dateString - ISO date string like "2025-11-25"
 */
export function formatPurchaseDate(dateString: string): string {
  // Append T00:00:00 to prevent timezone shift (treat as local midnight)
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format a date-time string to local date without timezone shift
 * Returns format: MM/DD/YYYY
 * @param dateString - ISO datetime string
 */
export function formatLocalDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format a date-time string to local date and time
 * Returns format: MM/DD/YYYY, HH:MM:SS AM/PM
 * @param dateString - ISO datetime string
 */
export function formatLocalDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
