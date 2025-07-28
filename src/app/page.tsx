'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Check if this is a logout redirect
    const isLogoutCallback = searchParams.get('logout') === 'true';
    
    if (isLogoutCallback) {
      setIsLoggingOut(true);
      // Give session cleanup time to complete
      const timer = setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    // Only redirect to dashboard if authenticated AND not in the process of logging out
    if (status === 'authenticated' && !isLoggingOut) {
      router.push('/dashboard');
    }
  }, [status, router, isLoggingOut]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show logout success message if coming from logout
  const isLogoutCallback = searchParams.get('logout') === 'true';
  if (isLogoutCallback && status !== 'authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
            </div>
          </div>

          <h1 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
            Successfully Signed Out
          </h1>
          <p className="mt-4 text-center text-lg text-gray-600 dark:text-gray-300">
            You have been safely logged out of your account.
          </p>

          <div className="mt-8 space-y-4">
            <Link
              href="/auth/signin"
              className="group w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-[1.02] transition-all duration-200"
            >
              Sign In Again
            </Link>
            <Link
              href="/"
              onClick={() => window.history.replaceState({}, '', '/')}
              className="group w-full flex justify-center py-3 px-4 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-lg text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-[1.02] transition-all duration-200"
            >
              Back to Home
            </Link>
          </div>

          <div className="mt-6 bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm py-4 px-6 rounded-xl border border-green-200/50 dark:border-green-700/50">
            <p className="text-sm text-green-800 dark:text-green-200 text-center">
              🔒 Your session has been securely terminated and all tokens have been cleared.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-indigo-200 dark:bg-indigo-800 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-40 left-20 w-16 h-16 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20 animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-teal-200 dark:bg-teal-800 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-300">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
          </div>
        </div>

        <h1 className="mt-6 text-center text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent animate-fade-in">
          Electricity Tokens Tracker
        </h1>
        <p className="mt-4 text-center text-lg text-gray-600 dark:text-gray-300 animate-fade-in-delay">
          Smart electricity usage tracking with token-based billing
        </p>
        <div className="mt-2 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-200/50 dark:border-gray-700/50 transform hover:scale-[1.02] transition-all duration-300">
          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="group w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-700 dark:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transform hover:scale-[1.02] transition-all duration-200"
            >
              <span className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 group-hover:animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign In
              </span>
            </Link>
            <Link
              href="/auth/signup"
              className="group w-full flex justify-center py-3 px-4 border border-gray-300/50 dark:border-gray-600/50 rounded-xl shadow-lg text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transform hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm"
            >
              <span className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 group-hover:animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Create Account
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-8 px-6 shadow-2xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            ⚡ Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors duration-200">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Token Tracking
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Track electricity usage by tokens (1 token = 1 kWh)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-green-50/50 dark:bg-green-900/20 hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors duration-200">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Smart Analytics
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Generate detailed usage reports and insights
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/20 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors duration-200">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Multi-User
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Manage shared meter readings and individual costs
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-900/20 hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-colors duration-200">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Cost Tracking
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Monitor emergency purchases and optimize costs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
