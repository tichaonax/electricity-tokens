'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, DollarSign, PieChart, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthlyCostChart } from '@/components/reports/monthly-cost-chart';
import { PaymentTrackingChart } from '@/components/reports/payment-tracking-chart';
import { PaymentBalanceChart } from '@/components/reports/payment-balance-chart';
import { AnnualOverviewChart } from '@/components/reports/annual-overview-chart';

export default function FinancialReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeReport, setActiveReport] = useState<string>('monthly-costs');
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const reportTypes = [
    {
      id: 'monthly-costs',
      name: 'Monthly Cost Summaries',
      description: 'Track monthly spending patterns and cost efficiency',
      icon: TrendingUp,
    },
    {
      id: 'payment-tracking',
      name: 'Payment Contribution Tracking',
      description: 'Monitor individual user payment patterns over time',
      icon: PieChart,
    },
    {
      id: 'payment-balance',
      name: 'Payment Balance Analysis',
      description: 'Analyze overpayments and underpayments by user',
      icon: DollarSign,
    },
    {
      id: 'annual-overview',
      name: 'Annual Financial Overview',
      description: 'Comprehensive yearly financial summary and insights',
      icon: Calendar,
    },
  ];

  const setCurrentMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setDateRange({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
    });
  };

  const setCurrentYear = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    setDateRange({
      startDate: startOfYear.toISOString().split('T')[0],
      endDate: endOfYear.toISOString().split('T')[0],
    });
  };

  const setLastThreeMonths = () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setDateRange({
      startDate: threeMonthsAgo.toISOString().split('T')[0],
      endDate: endOfCurrentMonth.toISOString().split('T')[0],
    });
  };

  const clearDateRange = () => {
    setDateRange({});
  };

  const renderReportComponent = () => {
    const commonProps = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };

    switch (activeReport) {
      case 'monthly-costs':
        return <MonthlyCostChart {...commonProps} />;
      case 'payment-tracking':
        return <PaymentTrackingChart {...commonProps} />;
      case 'payment-balance':
        return <PaymentBalanceChart {...commonProps} />;
      case 'annual-overview':
        return <AnnualOverviewChart {...commonProps} />;
      default:
        return <MonthlyCostChart {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white shadow dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-2 sm:mr-4 flex-shrink-0 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0" />
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Financial Reports
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="text-right min-w-0">
                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 truncate">
                  {session.user?.name}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  ({session.user?.role})
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Financial Analytics &amp; Reports
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Comprehensive financial insights, payment tracking, and cost analysis for electricity usage.
            </p>
          </div>

          {/* Date Range Controls */}
          <div className="mb-6 bg-white rounded-lg shadow p-4 dark:bg-slate-800">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date Range:
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.startDate || ''}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="w-full sm:w-auto px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                  <span className="text-slate-500 hidden sm:inline">to</span>
                  <input
                    type="date"
                    value={dateRange.endDate || ''}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="w-full sm:w-auto px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" size="sm" onClick={setCurrentMonth} className="flex-1 sm:flex-none">
                  This Month
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={setLastThreeMonths} className="flex-1 sm:flex-none">
                  Last 3 Months
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={setCurrentYear} className="flex-1 sm:flex-none">
                  This Year
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearDateRange} className="flex-1 sm:flex-none">
                  All Time
                </Button>
              </div>
            </div>
          </div>

          {/* Report Type Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportTypes.map((report) => {
                const Icon = report.icon;
                return (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      activeReport === report.id
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                    onClick={() => setActiveReport(report.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {report.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-lg shadow-lg dark:bg-slate-800 p-6">
            {renderReportComponent()}
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 dark:bg-green-950 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
              Understanding Financial Reports
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Monthly Costs &amp; Payment Tracking
                </h4>
                <ul className="space-y-1 text-green-700 dark:text-green-300">
                  <li>• Monitor monthly spending patterns and efficiency</li>
                  <li>• Track emergency vs regular purchase costs</li>
                  <li>• Analyze individual payment contribution patterns</li>
                  <li>• Identify cost optimization opportunities</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Balance Analysis &amp; Annual Overview
                </h4>
                <ul className="space-y-1 text-green-700 dark:text-green-300">
                  <li>• Calculate overpayments and underpayments</li>
                  <li>• Balance reconciliation by user</li>
                  <li>• Comprehensive yearly financial summaries</li>
                  <li>• Emergency purchase impact assessment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}