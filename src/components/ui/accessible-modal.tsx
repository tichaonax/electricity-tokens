'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
import { AccessibleButton } from './accessible-button';
import { cn } from '@/lib/utils';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  hideCloseButton?: boolean;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  closeOnOverlayClick = true,
  hideCloseButton = false,
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description
    ? `modal-description-${Math.random().toString(36).substr(2, 9)}`
    : undefined;

  const { containerRef, focusFirst } = useKeyboardNavigation(isOpen, {
    trapFocus: true,
    restoreFocus: true,
    onEscape: onClose,
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus first element after a brief delay to ensure modal is rendered
      setTimeout(() => focusFirst(), 100);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, focusFirst]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  if (!isOpen) return null;

  const modalElement = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={(node) => {
          modalRef.current = node;
          if (containerRef) {
            containerRef.current = node;
          }
        }}
        className={cn(
          'relative bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700',
          'w-full',
          sizeClasses[size],
          'max-h-[90vh] overflow-y-auto',
          // High contrast support
          'contrast-more:border-2 contrast-more:border-slate-900 dark:contrast-more:border-slate-100',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-slate-600 dark:text-slate-400"
              >
                {description}
              </p>
            )}
          </div>

          {!hideCloseButton && (
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close modal"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </AccessibleButton>
          )}
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : null;
}

// Accessible form modal with proper labeling
export function AccessibleFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}) {
  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      className={className}
      hideCloseButton
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="space-y-4">{children}</div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <AccessibleButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </AccessibleButton>
          <AccessibleButton
            type="submit"
            loading={isSubmitting}
            loadingText="Saving..."
          >
            {submitLabel}
          </AccessibleButton>
        </div>
      </form>
    </AccessibleModal>
  );
}
