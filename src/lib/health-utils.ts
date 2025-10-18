/**
 * Health monitoring utility functions and type definitions
 */

export type HealthStatusType = 'healthy' | 'degraded' | 'offline';

export interface HealthResponse {
  status: HealthStatusType;
  timestamp: string;
  uptime: number;
  uptimeFormatted: string;
  startTime: string;
  environment?: string;
  database?: {
    connected: boolean;
  };
  error?: string;
}

export interface HealthDisplayState {
  status: HealthStatusType;
  uptimeFormatted: string;
  lastChecked: Date;
  isLoading: boolean;
  consecutiveFailures: number;
}

/**
 * Format uptime in seconds to human-readable format
 * @param seconds - Uptime in seconds
 * @returns Formatted string like "2d 5h 23m" or "5h 23m" or "23m"
 */
export function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return 'Just started';
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : 'Just started';
}

/**
 * Determine health status based on API response and failure count
 * @param response - Health API response or null if failed
 * @param consecutiveFailures - Number of consecutive failed requests
 * @returns Status type: 'healthy', 'degraded', or 'offline'
 */
export function determineHealthStatus(
  response: HealthResponse | null,
  consecutiveFailures: number
): HealthStatusType {
  // If 2+ consecutive failures, consider offline
  if (consecutiveFailures >= 2 || !response) {
    return 'offline';
  }

  // If we have a response, use its status
  return response.status;
}

/**
 * Get color classes for status badge based on health status
 * @param status - Current health status
 * @returns Tailwind CSS classes for the badge
 */
export function getStatusColors(status: HealthStatusType): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
    case 'degraded':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
    case 'offline':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700';
  }
}

/**
 * Get status icon name based on health status
 * @param status - Current health status
 * @returns Icon identifier for rendering
 */
export function getStatusIcon(
  status: HealthStatusType
): 'check' | 'alert' | 'x' {
  switch (status) {
    case 'healthy':
      return 'check';
    case 'degraded':
      return 'alert';
    case 'offline':
      return 'x';
    default:
      return 'alert';
  }
}

/**
 * Get user-friendly status text
 * @param status - Current health status
 * @returns Human-readable status text
 */
export function getStatusText(status: HealthStatusType): string {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'degraded':
      return 'Degraded';
    case 'offline':
      return 'Offline';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate exponential backoff delay for retry attempts
 * @param failureCount - Number of consecutive failures
 * @param baseDelay - Base delay in milliseconds (default: 30000 = 30s)
 * @param maxDelay - Maximum delay in milliseconds (default: 300000 = 5min)
 * @returns Delay in milliseconds before next retry
 */
export function calculateBackoffDelay(
  failureCount: number,
  baseDelay: number = 30000,
  maxDelay: number = 300000
): number {
  if (failureCount === 0) return baseDelay;

  // Exponential backoff: base * 2^failures, capped at maxDelay
  const delay = Math.min(baseDelay * Math.pow(2, failureCount - 1), maxDelay);
  return delay;
}
