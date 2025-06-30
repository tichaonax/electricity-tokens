'use client';

import { AlertTriangle, AlertCircle, XCircle, RefreshCw, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error?: string | Error | null;
  title?: string;
  variant?: 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showRetry?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  title,
  variant = 'error',
  size = 'md',
  showRetry = false,
  onRetry,
  onDismiss,
  className
}: ErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  const variants = {
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-800 dark:text-red-200',
      text: 'text-red-700 dark:text-red-300',
      IconComponent: XCircle
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-200', 
      text: 'text-yellow-700 dark:text-yellow-300',
      IconComponent: AlertTriangle
    },
    info: {
      container: 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-200',
      text: 'text-blue-700 dark:text-blue-300',
      IconComponent: AlertCircle
    }
  };

  const sizes = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-sm',
    lg: 'p-6 text-base'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const { container, icon, title: titleStyle, text, IconComponent } = variants[variant];

  return (
    <div className={cn(
      'border rounded-lg',
      container,
      sizes[size],
      className
    )}>
      <div className="flex items-start gap-3">
        <IconComponent className={cn(iconSizes[size], icon, 'flex-shrink-0 mt-0.5')} />
        
        <div className="flex-1 space-y-2">
          {title && (
            <h3 className={cn('font-medium', titleStyle)}>
              {title}
            </h3>
          )}
          
          <p className={cn(text)}>
            {errorMessage}
          </p>

          {(showRetry || onRetry) && (
            <div className="flex gap-2 pt-1">
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="h-8 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5',
              icon
            )}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Inline error for form fields
export function FieldError({ error, className }: { error?: string | null; className?: string }) {
  if (!error) return null;

  return (
    <p className={cn('text-sm text-red-600 dark:text-red-400 mt-1', className)}>
      {error}
    </p>
  );
}

// Empty state component
export function EmptyState({
  icon: Icon = AlertCircle,
  title,
  description,
  action,
  className
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('text-center py-12', className)}>
      <Icon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
      <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}