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
