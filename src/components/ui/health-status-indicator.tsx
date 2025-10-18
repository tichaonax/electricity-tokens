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
  getLEDColors,
  getPulseAnimation,
} from '@/lib/health-utils';
import { HealthStatusDetailModal } from './health-status-detail-modal';

/**
 * HealthStatusIndicator Component
 *
 * Displays a real-time health status badge showing:
 * - Mobile (<640px): LED-only with tap-to-expand modal
 * - Tablet (640px-1024px): LED + status text
 * - Desktop (>1024px): Full badge with LED + status + uptime
 * - Auto-updates via polling every 30 seconds
 * - Visible on all pages without authentication
 */
export function HealthStatusIndicator() {
  const [status, setStatus] = useState<HealthStatusType>('healthy');
  const [uptimeFormatted, setUptimeFormatted] = useState<string>('Checking...');
  const [isLoading, setIsLoading] = useState(true);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [databaseStatus, setDatabaseStatus] = useState<
    'connected' | 'disconnected' | 'unknown'
  >('unknown');

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
      setLastChecked(new Date());

      // Update database status
      if (data.database?.connected) {
        setDatabaseStatus('connected');
      } else if (data.database?.connected === false) {
        setDatabaseStatus('disconnected');
      } else {
        setDatabaseStatus('unknown');
      }

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
      setLastChecked(new Date());
      setDatabaseStatus('unknown');

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
    <>
      {/* Mobile View: LED-only with tap to expand - Positioned to left of profile menu */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed top-4 right-16 z-50 p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label={`Health status: ${getStatusText(status)}. Tap for details.`}
          role="button"
        >
          <div
            className={`h-3 w-3 rounded-full shadow-lg ${getLEDColors(status)} ${getPulseAnimation(status)}`}
          />
        </button>
      </div>

      {/* Tablet View: LED + Status Text - Positioned to left of profile menu */}
      <div className="hidden sm:flex lg:hidden">
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed top-4 right-20 z-50 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg"
          aria-label={`Health status: ${getStatusText(status)}. Click for details.`}
        >
          <div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border backdrop-blur-sm
              ${getStatusColors(status)}
              ${isLoading ? 'opacity-70' : 'opacity-100'}
            `}
          >
            <div className="flex-shrink-0">{renderStatusIcon()}</div>
            <span className="text-xs font-semibold">
              {getStatusText(status)}
            </span>
          </div>
        </button>
      </div>

      {/* Desktop View: Full Display - Positioned left side (below navbar) */}
      <div
        className="hidden lg:block fixed top-20 left-4 z-40 transition-all duration-300"
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">
              {getStatusText(status)}
            </span>

            {status !== 'offline' && uptimeFormatted !== 'Unknown' && (
              <>
                <span className="text-xs opacity-50">•</span>
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

      {/* Detail Modal (Mobile & Tablet) */}
      <HealthStatusDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        status={status}
        uptimeFormatted={uptimeFormatted}
        lastChecked={lastChecked}
        databaseStatus={databaseStatus}
      />
    </>
  );
}
