'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface HighContrastContextType {
  isHighContrast: boolean;
  toggleHighContrast: () => void;
}

const HighContrastContext = createContext<HighContrastContextType | undefined>(
  undefined
);

export function HighContrastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check for system preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Check for stored preference
    const stored = localStorage.getItem('high-contrast');
    if (stored !== null) {
      setIsHighContrast(stored === 'true');
    }
  }, []);

  useEffect(() => {
    // Apply high contrast class to document
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('high-contrast', newValue.toString());
  };

  return (
    <HighContrastContext.Provider
      value={{ isHighContrast, toggleHighContrast }}
    >
      {children}
    </HighContrastContext.Provider>
  );
}

export function useHighContrast() {
  const context = useContext(HighContrastContext);
  if (context === undefined) {
    throw new Error(
      'useHighContrast must be used within a HighContrastProvider'
    );
  }
  return context;
}

interface HighContrastButtonProps {
  className?: string;
}

export function HighContrastButton({ className }: HighContrastButtonProps) {
  const { isHighContrast, toggleHighContrast } = useHighContrast();

  return (
    <button
      onClick={toggleHighContrast}
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md',
        'bg-slate-100 text-slate-700 hover:bg-slate-200',
        'dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        'transition-colors duration-200',
        className
      )}
      aria-label={
        isHighContrast
          ? 'Disable high contrast mode'
          : 'Enable high contrast mode'
      }
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20" />
      </svg>
      {isHighContrast ? 'High Contrast On' : 'High Contrast Off'}
    </button>
  );
}

// High contrast utility classes
export const highContrastClasses = {
  // Backgrounds
  bgPrimary: 'high-contrast:bg-white dark:high-contrast:bg-black',
  bgSecondary: 'high-contrast:bg-slate-100 dark:high-contrast:bg-slate-900',
  bgAccent: 'high-contrast:bg-indigo-100 dark:high-contrast:bg-indigo-900',

  // Text colors
  textPrimary: 'high-contrast:text-black dark:high-contrast:text-white',
  textSecondary:
    'high-contrast:text-slate-800 dark:high-contrast:text-slate-200',
  textAccent:
    'high-contrast:text-indigo-800 dark:high-contrast:text-indigo-200',

  // Borders
  borderPrimary:
    'high-contrast:border-black dark:high-contrast:border-white high-contrast:border-2',
  borderSecondary:
    'high-contrast:border-slate-600 dark:high-contrast:border-slate-400 high-contrast:border-2',

  // Interactive elements
  button:
    'high-contrast:border-2 high-contrast:border-black dark:high-contrast:border-white high-contrast:bg-white high-contrast:text-black dark:high-contrast:bg-black dark:high-contrast:text-white',
  link: 'high-contrast:text-blue-800 dark:high-contrast:text-blue-200 high-contrast:underline',

  // Focus states
  focus:
    'high-contrast:focus:outline-black dark:high-contrast:focus:outline-white high-contrast:focus:outline-2 high-contrast:focus:outline-solid',
};

interface HighContrastCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HighContrastCard({
  children,
  className,
}: HighContrastCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6',
        highContrastClasses.bgPrimary,
        highContrastClasses.borderPrimary,
        className
      )}
    >
      {children}
    </div>
  );
}

interface HighContrastTextProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export function HighContrastText({
  children,
  variant = 'primary',
  className,
}: HighContrastTextProps) {
  const variantClasses = {
    primary: highContrastClasses.textPrimary,
    secondary: highContrastClasses.textSecondary,
    accent: highContrastClasses.textAccent,
  };

  return (
    <span className={cn(variantClasses[variant], className)}>{children}</span>
  );
}

interface HighContrastLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

export function HighContrastLink({
  href,
  children,
  className,
  external = false,
}: HighContrastLinkProps) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cn(
        'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200',
        'underline decoration-2 underline-offset-2',
        highContrastClasses.link,
        highContrastClasses.focus,
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        className
      )}
    >
      {children}
      {external && (
        <svg
          className="inline w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
    </a>
  );
}
