'use client';

import React, { useEffect, useRef } from 'react';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}

export function ScreenReaderOnly({
  children,
  as: Component = 'span',
  className = '',
}: ScreenReaderOnlyProps) {
  const ElementComponent = Component as React.ElementType;
  return (
    <ElementComponent className={`sr-only ${className}`}>
      {children}
    </ElementComponent>
  );
}

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export function LiveRegion({
  message,
  politeness = 'polite',
  atomic = false,
  relevant = 'all',
}: LiveRegionProps) {
  return (
    <div
      className="sr-only"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role="status"
    >
      {message}
    </div>
  );
}

interface AccessibleStatusProps {
  status: 'loading' | 'success' | 'error' | 'idle';
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function AccessibleStatus({
  status,
  loadingMessage = 'Loading...',
  successMessage = 'Operation completed successfully',
  errorMessage = 'An error occurred',
}: AccessibleStatusProps) {
  const getMessage = () => {
    switch (status) {
      case 'loading':
        return loadingMessage;
      case 'success':
        return successMessage;
      case 'error':
        return errorMessage;
      default:
        return '';
    }
  };

  const message = getMessage();
  if (!message) return null;

  return (
    <LiveRegion
      message={message}
      politeness={status === 'error' ? 'assertive' : 'polite'}
      atomic={true}
    />
  );
}

interface AccessibleProgressProps {
  value: number;
  max?: number;
  label?: string;
  description?: string;
  className?: string;
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  description,
  className = '',
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {percentage}%
          </span>
        </div>
      )}

      <div
        className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
        aria-describedby={
          description
            ? `progress-desc-${Math.random().toString(36).substr(2, 9)}`
            : undefined
        }
      >
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {description && (
        <p
          id={`progress-desc-${Math.random().toString(36).substring(2, 9)}`}
          className="mt-1 text-xs text-slate-600 dark:text-slate-400"
        >
          {description}
        </p>
      )}

      <ScreenReaderOnly>
        {`Progress: ${percentage}% complete. ${value} of ${max}.`}
      </ScreenReaderOnly>
    </div>
  );
}

interface FocusAnnouncement {
  message: string;
  delay?: number;
}

export function useFocusAnnouncement() {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = ({ message, delay = 100 }: FocusAnnouncement) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;

      document.body.appendChild(announcement);

      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { announce };
}

interface AccessibleTableProps {
  caption?: string;
  headers: string[];
  rows: Array<Array<string | React.ReactNode>>;
  className?: string;
}

export function AccessibleTable({
  caption,
  headers,
  rows,
  className = '',
}: AccessibleTableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className={`min-w-full divide-y divide-slate-200 dark:divide-slate-700 ${className}`}
        role="table"
      >
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr role="row">
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400"
                role="columnheader"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody
          className="bg-white divide-y divide-slate-200 dark:bg-slate-900 dark:divide-slate-700"
          role="rowgroup"
        >
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} role="row">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100"
                  role="cell"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function AccessibleHeading({
  level,
  children,
  className = '',
  id,
}: AccessibleHeadingProps) {
  const Component = `h${level}` as keyof React.JSX.IntrinsicElements;
  const ElementComponent = Component as React.ElementType;

  const baseClasses = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-semibold',
    4: 'text-lg font-medium',
    5: 'text-base font-medium',
    6: 'text-sm font-medium',
  };

  return (
    <ElementComponent
      id={id}
      className={`${baseClasses[level]} text-slate-900 dark:text-slate-100 contrast-more:text-black dark:contrast-more:text-white ${className}`}
      role="heading"
      aria-level={level}
    >
      {children}
    </ElementComponent>
  );
}
