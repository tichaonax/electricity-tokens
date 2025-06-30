'use client';

import { forwardRef } from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends ButtonProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-haspopup'?:
    | boolean
    | 'false'
    | 'true'
    | 'menu'
    | 'listbox'
    | 'tree'
    | 'grid'
    | 'dialog';
  role?: string;
  loading?: boolean;
  loadingText?: string;
}

export const AccessibleButton = forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(
  (
    {
      children,
      className,
      loading = false,
      loadingText = 'Loading...',
      disabled,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-expanded': ariaExpanded,
      'aria-pressed': ariaPressed,
      'aria-haspopup': ariaHaspopup,
      role,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <Button
        ref={ref}
        className={cn(
          // Enhanced focus styles for accessibility
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
          // High contrast support
          'contrast-more:border-2 contrast-more:border-current',
          // Better disabled state visibility
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className
        )}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-pressed={ariaPressed}
        aria-haspopup={ariaHaspopup}
        aria-disabled={isDisabled}
        role={role}
        {...props}
      >
        {loading ? (
          <>
            <span className="sr-only">{loadingText}</span>
            <div
              className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"
              aria-hidden="true"
            />
            <span aria-hidden="true">{children}</span>
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
