'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    // Error: error.message
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Something went wrong
        </h1>
        
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          An unexpected error occurred while processing your request
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            {/* Error message for development */}
            {isDevelopment && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                      Development Error Details
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p className="break-all">{error.message}</p>
                      {error.digest && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                          Error ID: {error.digest}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* What happened */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
                What can you do?
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Try refreshing the page</li>
                <li>• Check your internet connection</li>
                <li>• Go back to the previous page</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <Link
                href="/dashboard"
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
              
              <Link
                href="/help"
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Get Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          If this problem continues, please contact support at{' '}
          <a 
            href="mailto:support@electricitytokens.com" 
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            support@electricitytokens.com
          </a>
        </p>
      </div>
    </div>
  );
}