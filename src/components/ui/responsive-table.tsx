'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { EmptyState } from './error-display';
import { Zap } from 'lucide-react';

interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
  className?: string;
  mobileHide?: boolean; // Hide this column on mobile
  mobileLabel?: string; // Different label for mobile
}

interface ResponsiveTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function ResponsiveTable<T = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
}: ResponsiveTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState icon={Zap} title="No data found" description={emptyMessage} />
    );
  }

  return (
    <div className={className}>
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || 'text-gray-900 dark:text-gray-100'}`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {data.map((row, index) => (
          <Card
            key={index}
            className={`${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={
              onRowClick
                ? (e) => {
                    // Don't trigger row click if clicking on mobile actions
                    if (!(e.target as HTMLElement).closest('.mobile-actions')) {
                      onRowClick(row);
                    }
                  }
                : undefined
            }
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {columns
                  .filter((column) => !column.mobileHide)
                  .map((column) => {
                    const value = row[column.key];
                    const displayValue = column.render
                      ? column.render(value, row)
                      : value;

                    return (
                      <div
                        key={column.key}
                        className="flex justify-between items-start"
                      >
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-0 flex-1">
                          {column.mobileLabel || column.label}:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100 ml-2 min-w-0 flex-1 text-right">
                          {displayValue}
                        </span>
                      </div>
                    );
                  })}

                {/* Mobile actions if provided */}
                {row.mobileActions && (
                  <div
                    className="mobile-actions pt-3 border-t border-gray-100 dark:border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {row.mobileActions}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper component for action buttons in mobile cards
interface MobileActionsProps {
  children: ReactNode;
  className?: string;
}

export function MobileActions({
  children,
  className = '',
}: MobileActionsProps) {
  return (
    <div
      className={`flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
}

// Helper component for touch-friendly buttons
interface TouchButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function TouchButton({
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  children,
  className = '',
}: TouchButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600',
    secondary:
      'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]', // Minimum 36px for touch targets
    md: 'px-4 py-2 text-sm min-h-[40px]', // Minimum 40px for touch targets
    lg: 'px-6 py-3 text-base min-h-[44px]', // Minimum 44px for touch targets
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// Helper component for responsive badges
interface ResponsiveBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function ResponsiveBadge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  ...props
}: ResponsiveBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
  };

  return (
    <Badge
      variant={variant}
      className={`${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </Badge>
  );
}
