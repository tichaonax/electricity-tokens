'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  if (text) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        <span className="text-sm text-slate-600 dark:text-slate-400">{text}</span>
      </div>
    );
  }

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
}

export function LoadingOverlay({ 
  isVisible, 
  text = "Loading...",
  className 
}: { 
  isVisible: boolean; 
  text?: string;
  className?: string;
}) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{text}</p>
      </div>
    </div>
  );
}

export function LoadingButton({ 
  isLoading, 
  children, 
  className,
  ...props 
}: { 
  isLoading: boolean; 
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={cn(
        "relative inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors",
        "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  );
}

export function PageLoader({ text = "Loading page..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{text}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Please wait while we load your content</p>
      </div>
    </div>
  );
}