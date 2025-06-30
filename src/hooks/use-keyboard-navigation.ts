'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useKeyboardNavigation(
  enabled: boolean = true,
  options: {
    skipSelector?: string;
    trapFocus?: boolean;
    restoreFocus?: boolean;
    onEscape?: () => void;
  } = {}
) {
  const containerRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    let elements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    );

    if (options.skipSelector) {
      elements = elements.filter((el) => !el.matches(options.skipSelector!));
    }

    return elements.filter((el) => {
      const style = getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        !el.hasAttribute('disabled')
      );
    });
  }, [options.skipSelector]);

  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current) return;

      const { key, shiftKey } = event;
      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) return;

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      );

      switch (key) {
        case 'Escape':
          if (options.onEscape) {
            event.preventDefault();
            options.onEscape();
          }
          break;

        case 'Tab':
          if (options.trapFocus && focusableElements.length > 1) {
            if (shiftKey) {
              // Shift + Tab - move to previous element
              if (currentIndex <= 0) {
                event.preventDefault();
                focusLast();
              }
            } else {
              // Tab - move to next element
              if (currentIndex >= focusableElements.length - 1) {
                event.preventDefault();
                focusFirst();
              }
            }
          }
          break;

        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % focusableElements.length;
          focusableElements[nextIndex].focus();
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          const prevIndex =
            currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
          focusableElements[prevIndex].focus();
          break;

        case 'Home':
          event.preventDefault();
          focusFirst();
          break;

        case 'End':
          event.preventDefault();
          focusLast();
          break;
      }
    },
    [enabled, getFocusableElements, focusFirst, focusLast, options]
  );

  useEffect(() => {
    if (!enabled) return;

    if (options.restoreFocus) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (options.restoreFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [enabled, handleKeyDown, options.restoreFocus]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    getFocusableElements,
  };
}

export function useSkipLink() {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  const handleSkipToContent = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    skipLinkRef,
    handleSkipToContent,
  };
}
