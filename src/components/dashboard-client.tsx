'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { ResponsiveNav } from '@/components/ui/responsive-nav';
import { HelpPopover } from '@/components/ui/help-popover';
import { ContributionProgress } from '@/components/contribution-progress';
import { ProgressiveConsumptionWidget } from '@/components/ui/progressive-consumption-widget';
import { RunningBalanceWidget } from '@/components/ui/running-balance-widget';
import { MaxDailyConsumptionWidget } from '@/components/ui/max-daily-consumption-widget';
// Skeleton components imported but not currently used in this component
// import { QuickStatsSkeleton, DashboardGridSkeleton, ContributionProgressSkeleton } from '@/components/ui/skeleton';

interface QuickStats {
  totalTokensUsed: number;
  totalAmountPaid: number;
  averageCostPerKwh: number;
  accountBalance: number;
}

export function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { checkPermission, isAdmin } = usePermissions();
  const { navigateAndSaveScroll } = useScrollRestoration('dashboard');
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchQuickStats();
    }
  }, [status, router]);

  const fetchQuickStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setQuickStats(data.personalSummary);
      }
    } catch {
      // Error fetching quick stats
    } finally {
      setLoadingStats(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500 absolute top-0 left-0"></div>
          </div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ResponsiveNav title="Electricity Tokens Tracker" />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Welcome back, {session?.user?.name}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track your electricity usage and manage your token
                  contributions
                </p>
              </div>
              <HelpPopover
                title="Getting Started"
                items={[
                  {
                    title: 'Track Purchases',
                    description:
                      'Add new electricity token purchases and track their usage across all users.',
                  },
                  {
                    title: 'View Reports',
                    description:
                      'Analyze your usage patterns, costs, and efficiency with detailed reports and charts.',
                  },
                  {
                    title: 'Manage Contributions',
                    description:
                      'Add your usage contributions to purchases and see your fair share calculations.',
                  },
                ]}
              />
            </div>
          </div>

          {/* Contribution Progress */}
          <ContributionProgress />

          {/* Dashboard Widgets */}
          {(() => {
            // Check which widgets the user has permission to view
            const canViewProgressive = checkPermission(
              'canViewProgressiveTokenConsumption'
            );
            const canViewBalance = checkPermission('canViewAccountBalance');
            const canViewMaxDaily = checkPermission(
              'canViewMaximumDailyConsumption'
            );

            const visibleWidgets = [
              canViewProgressive && 'progressive',
              canViewBalance && 'balance',
              canViewMaxDaily && 'maxDaily',
            ].filter(Boolean);

            const visibleCount = visibleWidgets.length;

            // Return appropriate layout based on number of visible widgets
            if (visibleCount === 0) {
              return null; // No widgets to show
            }

            if (visibleCount === 1) {
              // Single widget - full width
              return (
                <div className="flex flex-col gap-6">
                  <div className="w-full">
                    {canViewProgressive && <ProgressiveConsumptionWidget />}
                    {canViewBalance && <RunningBalanceWidget />}
                    {canViewMaxDaily && <MaxDailyConsumptionWidget />}
                  </div>
                </div>
              );
            }

            if (visibleCount === 2) {
              // Two widgets - left and right justified on desktop
              return (
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 lg:pr-3">
                    {canViewProgressive && <ProgressiveConsumptionWidget />}
                    {!canViewProgressive && canViewBalance && (
                      <RunningBalanceWidget />
                    )}
                    {!canViewProgressive &&
                      !canViewBalance &&
                      canViewMaxDaily && <MaxDailyConsumptionWidget />}
                  </div>
                  <div className="flex-1 lg:pl-3">
                    {canViewProgressive && canViewBalance && (
                      <RunningBalanceWidget />
                    )}
                    {canViewProgressive &&
                      !canViewBalance &&
                      canViewMaxDaily && <MaxDailyConsumptionWidget />}
                    {!canViewProgressive &&
                      canViewBalance &&
                      canViewMaxDaily && <MaxDailyConsumptionWidget />}
                  </div>
                </div>
              );
            }

            // Three widgets - evenly spaced
            return (
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 lg:pr-2">
                  <ProgressiveConsumptionWidget />
                </div>
                <div className="flex-1 lg:px-2">
                  <RunningBalanceWidget />
                </div>
                <div className="flex-1 lg:pl-2">
                  <MaxDailyConsumptionWidget />
                </div>
              </div>
            );
          })()}

          {/* Quick Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Token Purchases Card - Only show if user can view purchase history */}
            {checkPermission('canViewPurchaseHistory') && (
              <button
                onClick={() =>
                  navigateAndSaveScroll('/dashboard/purchases/history')
                }
                className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer block text-left w-full card-hover transform hover:scale-[1.02]"
                title="View and manage all electricity token purchases with advanced filtering and sorting"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-5 h-5 text-white group-hover:animate-pulse"
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
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Purchase History
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          View & Manage
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      View purchase history with filters
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* New Purchase Card - Only show if user can access new purchase */}
            {checkPermission('canAccessNewPurchase') && (
              <button
                onClick={() =>
                  navigateAndSaveScroll('/dashboard/purchases/new')
                }
                className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer block text-left w-full card-hover transform hover:scale-[1.02]"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-5 h-5 text-white group-hover:animate-pulse"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          New Purchase
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Add Tokens
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                      Create new purchase
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* User Contributions Card - Only show if user can view user contributions */}
            {checkPermission('canViewUserContributions') && (
              <button
                onClick={() =>
                  navigateAndSaveScroll('/dashboard/contributions')
                }
                className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer block text-left w-full card-hover transform hover:scale-[1.02]"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-5 h-5 text-white group-hover:animate-pulse"
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
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          User Contributions
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Track Usage
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300">
                      View contributions
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Meter Readings Card - Only show if user can add meter readings */}
            {checkPermission('canAddMeterReadings') && (
              <button
                onClick={() =>
                  navigateAndSaveScroll('/dashboard/meter-readings')
                }
                className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer block text-left w-full card-hover transform hover:scale-[1.02]"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-5 h-5 text-white group-hover:animate-pulse"
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
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Meter Readings
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Daily Tracking
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      Add & manage daily meter readings
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Cost Analysis Card */}
            {checkPermission('canViewCostAnalysis') && (
              <button
                onClick={() =>
                  navigateAndSaveScroll('/dashboard/cost-analysis')
                }
                className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer block text-left w-full card-hover transform hover:scale-[1.02]"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-5 h-5 text-white group-hover:animate-pulse"
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
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Cost Analysis
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          View Insights
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-orange-700 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300">
                      Analyze costs & get recommendations
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Personal Dashboard Card */}
            {checkPermission('canViewPersonalDashboard') && (
              <button
                onClick={() => navigateAndSaveScroll('/dashboard/personal')}
                className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer block text-left w-full card-hover transform hover:scale-[1.02]"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-5 h-5 text-white group-hover:animate-pulse"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Personal Dashboard
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Your Overview
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-teal-700 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300">
                      View personal usage & trends
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Data Management Card */}
            {checkPermission('canExportData') && (
              <button
                onClick={() =>
                  navigateAndSaveScroll('/dashboard/data-management')
                }
                className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer block text-left w-full card-hover transform hover:scale-[1.02]"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-5 h-5 text-white group-hover:animate-pulse"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Data Management
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Export & Import
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Export data & bulk import
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Usage Reports Card */}
            {checkPermission('canViewUsageReports') && (
              <button
                onClick={() =>
                  navigateAndSaveScroll('/dashboard/reports/usage')
                }
                className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer block text-left w-full card-hover transform hover:scale-[1.02]"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-5 h-5 text-white group-hover:animate-pulse"
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
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Usage Reports
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Analytics & Charts
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                      View usage trends & cost analysis
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Financial Reports Card */}
            {checkPermission('canViewFinancialReports') && (
              <button
                onClick={() =>
                  navigateAndSaveScroll('/dashboard/reports/financial')
                }
                className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer block text-left w-full card-hover transform hover:scale-[1.02]"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg
                          className="w-5 h-5 text-white group-hover:animate-pulse"
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
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Financial Reports
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Cost & Balance Analysis
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                      View financial summaries & balances
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Efficiency Metrics Card */}
            {checkPermission('canViewEfficiencyReports') && (
              <button
                onClick={() =>
                  navigateAndSaveScroll('/dashboard/reports/efficiency')
                }
                className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer block text-left w-full card-hover transform hover:scale-[1.02]"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 rounded-md flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white group-hover:animate-pulse"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Efficiency Metrics
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Optimization & Predictions
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300">
                      Analyze efficiency & get predictions
                    </span>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Limited Access Notice */}
          {!checkPermission('canViewPurchaseHistory') &&
            !checkPermission('canAccessNewPurchase') &&
            !checkPermission('canViewUserContributions') &&
            !checkPermission('canViewUsageReports') &&
            !checkPermission('canViewFinancialReports') &&
            !checkPermission('canViewEfficiencyReports') &&
            !checkPermission('canViewCostAnalysis') && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Limited Dashboard Access
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <p>
                        You have basic access to the electricity tokens tracker.
                        To access core features like Purchase History, New
                        Purchase creation, User Contributions, Reports, or Cost
                        Analysis, please contact an administrator to request the
                        appropriate special permissions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Main Features Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Features & Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {/* Admin Panel Card - Only visible to admins */}
              {isAdmin && (
                <button
                  onClick={() => navigateAndSaveScroll('/dashboard/admin')}
                  className="group bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-red-200 dark:border-red-800 block text-left w-full card-hover transform hover:scale-[1.02]"
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg
                            className="w-5 h-5 text-white group-hover:animate-pulse"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                            Admin Panel
                          </dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            System Management
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 px-5 py-3">
                    <div className="text-sm">
                      <span className="font-medium text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        Manage users, settings & security
                      </span>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="mt-8">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                Quick Stats
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg
                            className="w-5 h-5 text-white group-hover:animate-pulse"
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
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                            Total Tokens Consumed
                          </dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {loadingStats ? (
                              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-16 rounded"></div>
                            ) : (
                              quickStats?.totalTokensUsed.toLocaleString() ||
                              '0'
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg
                            className="w-5 h-5 text-white group-hover:animate-pulse"
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
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                            Average Cost/Token
                          </dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {loadingStats ? (
                              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-20 rounded"></div>
                            ) : quickStats ? (
                              `$${quickStats.averageCostPerKwh.toFixed(3)}`
                            ) : (
                              '$0.000'
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg
                            className="w-5 h-5 text-white group-hover:animate-pulse"
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
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                            Total Spent
                          </dt>
                          <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {loadingStats ? (
                              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-18 rounded"></div>
                            ) : quickStats ? (
                              `$${quickStats.totalAmountPaid.toFixed(2)}`
                            ) : (
                              '$0.00'
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center ${
                            quickStats?.accountBalance &&
                            quickStats.accountBalance >= 0
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        >
                          <svg
                            className="w-5 h-5 text-white group-hover:animate-pulse"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                            Account Balance
                          </dt>
                          <dd
                            className={`text-lg font-medium ${
                              quickStats?.accountBalance &&
                              quickStats.accountBalance >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {loadingStats ? (
                              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-18 rounded"></div>
                            ) : quickStats ? (
                              `$${quickStats.accountBalance.toFixed(2)}`
                            ) : (
                              '$0.00'
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
