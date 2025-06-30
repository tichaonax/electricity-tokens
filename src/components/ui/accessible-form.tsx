'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface AccessibleFormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleFormField({
  label,
  description,
  error,
  required = false,
  children,
  className,
}: AccessibleFormFieldProps) {
  const fieldId = useId();
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          'block text-sm font-medium text-slate-700 dark:text-slate-300',
          'contrast-more:text-slate-900 dark:contrast-more:text-slate-100'
        )}
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && (
        <p
          id={descriptionId}
          className="text-sm text-slate-600 dark:text-slate-400"
        >
          {description}
        </p>
      )}

      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby':
            [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required,
          className: cn(
            (children as React.ReactElement).props?.className,
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
          ),
        })}
      </div>

      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 dark:text-red-500"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

interface AccessibleInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const AccessibleInput = forwardRef<
  HTMLInputElement,
  AccessibleInputProps
>(({ label, description, error, className, ...props }, ref) => {
  if (label) {
    return (
      <AccessibleFormField
        label={label}
        description={description}
        error={error}
        required={props.required}
      >
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
            'ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950',
            'focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950',
            'dark:placeholder:text-slate-400 dark:focus:ring-slate-300',
            // High contrast support
            'contrast-more:border-2 contrast-more:border-slate-900 dark:contrast-more:border-slate-100',
            className
          )}
          {...props}
        />
      </AccessibleFormField>
    );
  }

  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
        'ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950',
        'focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950',
        'dark:placeholder:text-slate-400 dark:focus:ring-slate-300',
        // High contrast support
        'contrast-more:border-2 contrast-more:border-slate-900 dark:contrast-more:border-slate-100',
        className
      )}
      {...props}
    />
  );
});

AccessibleInput.displayName = 'AccessibleInput';

interface AccessibleTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const AccessibleTextarea = forwardRef<
  HTMLTextAreaElement,
  AccessibleTextareaProps
>(({ label, description, error, className, ...props }, ref) => {
  if (label) {
    return (
      <AccessibleFormField
        label={label}
        description={description}
        error={error}
        required={props.required}
      >
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
            'ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2',
            'focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950',
            'dark:placeholder:text-slate-400 dark:focus:ring-slate-300',
            // High contrast support
            'contrast-more:border-2 contrast-more:border-slate-900 dark:contrast-more:border-slate-100',
            className
          )}
          {...props}
        />
      </AccessibleFormField>
    );
  }

  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
        'ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2',
        'focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950',
        'dark:placeholder:text-slate-400 dark:focus:ring-slate-300',
        // High contrast support
        'contrast-more:border-2 contrast-more:border-slate-900 dark:contrast-more:border-slate-100',
        className
      )}
      {...props}
    />
  );
});

AccessibleTextarea.displayName = 'AccessibleTextarea';

interface AccessibleSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const AccessibleSelect = forwardRef<
  HTMLSelectElement,
  AccessibleSelectProps
>(({ label, description, error, options, className, ...props }, ref) => {
  const selectElement = (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
        'ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-950',
        'focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950',
        'dark:focus:ring-slate-300',
        // High contrast support
        'contrast-more:border-2 contrast-more:border-slate-900 dark:contrast-more:border-slate-100',
        className
      )}
      {...props}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );

  if (label) {
    return (
      <AccessibleFormField
        label={label}
        description={description}
        error={error}
        required={props.required}
      >
        {selectElement}
      </AccessibleFormField>
    );
  }

  return selectElement;
});

AccessibleSelect.displayName = 'AccessibleSelect';
