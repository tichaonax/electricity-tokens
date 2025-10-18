'use client';

import { useEffect } from 'react';
import { X, Server, Clock, Database, RefreshCw } from 'lucide-react';
import {
  type HealthStatusType,
  getStatusText,
  formatLastChecked,
} from '@/lib/health-utils';

interface HealthStatusDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: HealthStatusType;
  uptimeFormatted: string;
  lastChecked: Date;
  databaseStatus?: 'connected' | 'disconnected' | 'unknown';
}

/**
 * HealthStatusDetailModal Component
 *
 * Modal that displays detailed health information on mobile devices
 * Triggered by tapping the LED indicator
 */
export function HealthStatusDetailModal({
  isOpen,
  onClose,
  status,
  uptimeFormatted,
  lastChecked,
  databaseStatus = 'unknown',
}: HealthStatusDetailModalProps) {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Get status-specific colors for the status badge
  const statusColorClass =
    status === 'healthy'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      : status === 'degraded'
        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-modal-title"
        className="fixed inset-x-4 bottom-4 sm:bottom-auto sm:top-20 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-[70] animate-in slide-in-from-bottom-8 sm:slide-in-from-top-8 duration-200"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2
              id="health-modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Health Status Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Server className="h-5 w-5" />
                <span className="font-medium">Status</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColorClass}`}
              >
                {getStatusText(status)}
              </span>
            </div>

            {/* Uptime */}
            {status !== 'offline' && uptimeFormatted !== 'Unknown' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Uptime</span>
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-semibold">
                  {uptimeFormatted}
                </span>
              </div>
            )}

            {/* Database Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Database className="h-5 w-5" />
                <span className="font-medium">Database</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  databaseStatus === 'connected'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : databaseStatus === 'disconnected'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                {databaseStatus === 'connected'
                  ? 'Connected'
                  : databaseStatus === 'disconnected'
                    ? 'Disconnected'
                    : 'Unknown'}
              </span>
            </div>

            {/* Last Checked */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <RefreshCw className="h-5 w-5" />
                <span className="font-medium">Last Checked</span>
              </div>
              <span className="text-gray-900 dark:text-gray-100 font-semibold">
                {formatLastChecked(lastChecked)}
              </span>
            </div>
          </div>

          {/* Footer hint */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Updates automatically every 30 seconds
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
