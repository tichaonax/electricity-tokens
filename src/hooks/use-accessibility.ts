'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Hook for managing focus within components
export function useFocusManagement() {
  const containerRef = useRef<HTMLElement>(null);
  const focusableElements = useRef<HTMLElement[]>([]);

  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return;

    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    const elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    ).filter((el) => {
      const style = getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    focusableElements.current = elements;
  }, []);

  const focusFirstElement = useCallback(() => {
    updateFocusableElements();
    if (focusableElements.current.length > 0) {
      focusableElements.current[0].focus();
    }
  }, [updateFocusableElements]);

  const focusLastElement = useCallback(() => {
    updateFocusableElements();
    const elements = focusableElements.current;
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [updateFocusableElements]);

  return {
    containerRef,
    focusFirstElement,
    focusLastElement,
    updateFocusableElements,
  };
}

// Hook for ARIA live regions
export function useLiveRegion() {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>(
    'polite'
  );

  const announce = useCallback(
    (text: string, priority: 'polite' | 'assertive' = 'polite') => {
      setMessage(''); // Clear first to ensure announcement
      setTimeout(() => {
        setMessage(text);
        setPoliteness(priority);
      }, 10);
    },
    []
  );

  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  return {
    message,
    politeness,
    announce,
    clearMessage,
  };
}

// Hook for reduced motion preferences
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Hook for high contrast preferences
export function useHighContrastPreference() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHighContrast;
}

// Hook for managing ARIA expanded state
export function useAriaExpanded(initialState: boolean = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    ariaExpanded: isExpanded.toString(),
  };
}

// Hook for managing modal accessibility
export function useModalAccessibility(isOpen: boolean) {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Focus the modal after a brief delay
      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 100);
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';

      // Restore focus to the previously focused element
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
        previouslyFocusedElement.current = null;
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return { modalRef };
}

// Hook for form accessibility enhancements
export function useFormAccessibility() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const setFieldTouched = useCallback(
    (fieldName: string, touched: boolean = true) => {
      setTouched((prev) => ({ ...prev, [fieldName]: touched }));
    },
    []
  );

  const getFieldProps = useCallback(
    (fieldName: string) => {
      const hasError = fieldName in errors;

      return {
        'aria-invalid': hasError ? 'true' : undefined,
        'aria-describedby': hasError ? `${fieldName}-error` : undefined,
      };
    },
    [errors]
  );

  const getErrorProps = useCallback(
    (fieldName: string) => {
      const hasError = fieldName in errors;

      return hasError
        ? {
            id: `${fieldName}-error`,
            role: 'alert',
            'aria-live': 'polite',
          }
        : {};
    },
    [errors]
  );

  return {
    errors,
    touched,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    getFieldProps,
    getErrorProps,
  };
}

// Hook for accessible data tables
export function useAccessibleTable() {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
    },
    [sortColumn]
  );

  const getSortProps = useCallback(
    (column: string) => {
      const isCurrentColumn = sortColumn === column;

      return {
        'aria-sort': isCurrentColumn
          ? sortDirection === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none',
        role: 'columnheader',
        tabIndex: 0,
        onClick: () => handleSort(column),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSort(column);
          }
        },
      };
    },
    [sortColumn, sortDirection, handleSort]
  );

  return {
    sortColumn,
    sortDirection,
    handleSort,
    getSortProps,
  };
}
