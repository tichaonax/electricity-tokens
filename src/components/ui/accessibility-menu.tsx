'use client';

import { useState } from 'react';
import { Settings, Eye, EyeOff, Keyboard } from 'lucide-react';
import { useHighContrast } from '@/components/ui/high-contrast';
import { useReducedMotion } from '@/hooks/use-accessibility';
import { AccessibleButton } from '@/components/ui/accessible-button';
import { cn } from '@/lib/utils';

interface AccessibilityMenuProps {
  className?: string;
}

export function AccessibilityMenu({ className }: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isHighContrast, toggleHighContrast } = useHighContrast();
  const prefersReducedMotion = useReducedMotion();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn('relative', className)}>
      <AccessibleButton
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Accessibility settings"
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        <span className="sr-only">Accessibility Settings</span>
      </AccessibleButton>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
            'rounded-lg shadow-lg z-50 p-4 space-y-3',
            'contrast-more:border-2 contrast-more:border-slate-900 dark:contrast-more:border-slate-100'
          )}
          role="menu"
          aria-labelledby="accessibility-menu"
        >
          <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Accessibility Settings
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Customize your experience
            </p>
          </div>

          <div className="space-y-3">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isHighContrast ? (
                  <Eye className="h-4 w-4 text-slate-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-slate-600" />
                )}
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  High Contrast
                </span>
              </div>
              <AccessibleButton
                onClick={toggleHighContrast}
                size="sm"
                variant={isHighContrast ? 'default' : 'outline'}
                aria-pressed={isHighContrast}
                className="h-8 px-3"
              >
                {isHighContrast ? 'On' : 'Off'}
              </AccessibleButton>
            </div>

            {/* Reduced Motion Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-slate-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Reduced Motion
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                {prefersReducedMotion ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Keyboard Navigation Info */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Keyboard Shortcuts
              </h4>
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Tab / Shift+Tab</span>
                  <span>Navigate</span>
                </div>
                <div className="flex justify-between">
                  <span>Enter / Space</span>
                  <span>Activate</span>
                </div>
                <div className="flex justify-between">
                  <span>Escape</span>
                  <span>Close dialogs</span>
                </div>
                <div className="flex justify-between">
                  <span>Arrow keys</span>
                  <span>Move in groups</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <AccessibleButton
                onClick={() => setIsOpen(false)}
                size="sm"
                className="w-full"
              >
                Close Settings
              </AccessibleButton>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// Floating accessibility toolbar
export function AccessibilityToolbar() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={cn(
          'fixed bottom-4 right-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg',
          'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500',
          'transition-all duration-200',
          'contrast-more:border-2 contrast-more:border-white'
        )}
        aria-label="Toggle accessibility toolbar"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Toolbar */}
      {isVisible && (
        <div
          className={cn(
            'fixed bottom-20 right-4 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
            'rounded-lg shadow-lg p-4 w-72',
            'contrast-more:border-2 contrast-more:border-slate-900 dark:contrast-more:border-slate-100'
          )}
          role="toolbar"
          aria-label="Accessibility tools"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Accessibility Tools
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label="Close accessibility toolbar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <AccessibilityMenu />
        </div>
      )}
    </>
  );
}
