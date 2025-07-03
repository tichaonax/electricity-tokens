'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      // ErrorBoundary caught an error
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Something went wrong
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
            <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
            <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
              {error.toString()}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={resetError} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for functional error boundaries
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    // Error caught by useErrorHandler
    // Could integrate with error reporting service here
  };
}