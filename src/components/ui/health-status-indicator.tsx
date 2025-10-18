'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import {
  type HealthResponse,
  type HealthStatusType,
  determineHealthStatus,
  getStatusColors,
  getStatusText,
  calculateBackoffDelay,
} from '@/lib/health-utils';

/**
 * HealthStatusIndicator Component
 *
 * Displays a real-time health status badge showing:
 * - Application status (healthy/degraded/offline)
 * - Uptime in human-readable format
 * - Auto-updates via polling every 30 seconds
 * - Visible on all pages without authentication
 */
export function HealthStatusIndicator() {
  const [status, setStatus] = useState<HealthStatusType>('healthy');
  const [uptimeFormatted, setUptimeFormatted] = useState<string>('Checking...');
  const [isLoading, setIsLoading] = useState(true);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Fetch health status from API with error handling
   */
  const fetchHealthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: HealthResponse = await response.json();

      // Successful fetch - reset failure count
      setConsecutiveFailures(0);
      setStatus(data.status);
      setUptimeFormatted(data.uptimeFormatted || 'Unknown');
      setIsLoading(false);

      // Show indicator after first successful load
      if (!isVisible) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Health check failed:', error);

      // Increment failure count
      const newFailureCount = consecutiveFailures + 1;
      setConsecutiveFailures(newFailureCount);

      // Determine status based on failures
      const newStatus = determineHealthStatus(null, newFailureCount);
      setStatus(newStatus);
      setUptimeFormatted('Unknown');
      setIsLoading(false);

      // Show indicator even on failure (so users know it's offline)
      if (!isVisible) {
        setIsVisible(true);
      }
    }
  }, [consecutiveFailures, isVisible]);

  /**
   * Set up polling interval with exponential backoff on failures
   */
  useEffect(() => {
    // Initial fetch
    fetchHealthStatus();

    // Calculate polling interval based on failure count
    const pollingInterval = calculateBackoffDelay(
      consecutiveFailures,
      30000,
      300000
    );

    // Set up polling
    const intervalId = setInterval(fetchHealthStatus, pollingInterval);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchHealthStatus, consecutiveFailures]);

  /**
   * Render status icon based on current status
   */
  const renderStatusIcon = () => {
    const iconClass = 'h-4 w-4';

    switch (status) {
      case 'healthy':
        return <CheckCircle2 className={iconClass} />;
      case 'degraded':
        return <AlertTriangle className={iconClass} />;
      case 'offline':
        return <XCircle className={iconClass} />;
      default:
        return <Server className={iconClass} />;
    }
  };

  // Don't render until first check completes
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed top-4 left-4 z-50 transition-all duration-300"
      role="status"
      aria-live="polite"
      aria-label="Application health status"
    >
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border backdrop-blur-sm
          ${getStatusColors(status)}
          ${isLoading ? 'opacity-70' : 'opacity-100'}
        `}
      >
        {/* Status Icon */}
        <div className="flex-shrink-0">{renderStatusIcon()}</div>

        {/* Status Text & Uptime */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold">
              {getStatusText(status)}
            </span>
          </div>

          {status !== 'offline' && uptimeFormatted !== 'Unknown' && (
            <>
              <span className="hidden sm:inline text-xs opacity-50">•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 opacity-70" />
                <span className="text-xs font-normal">{uptimeFormatted}</span>
              </div>
            </>
          )}
        </div>

        {/* Screen reader text for accessibility */}
        <span className="sr-only">
          Application is {getStatusText(status).toLowerCase()}
          {status !== 'offline' &&
            uptimeFormatted !== 'Unknown' &&
            `, running for ${uptimeFormatted}`}
        </span>
      </div>
    </div>
  );
}
