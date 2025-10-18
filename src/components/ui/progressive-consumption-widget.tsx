'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface ConsumptionData {
  currentMonth: {
    period: string;
    consumed: number;
    totalContributed: number;
    costPerKwh: number;
  };
  previousMonth: {
    consumed: number;
    totalContributed: number;
    costPerKwh: number;
  };
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  historical: {
    totalPurchasedTokens: number;
    totalPurchasedCost: number;
    totalConsumedTokens: number;
    totalConsumedCost: number;
    averageCostPerKwhAllTime: number;
  };
}

export function ProgressiveConsumptionWidget() {
  const [data, setData] = useState<ConsumptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const { status } = useSession();
  const { checkPermission } = usePermissions();

  useEffect(() => {
    // Only fetch data if user has permission and session is loaded
    if (
      status === 'authenticated' &&
      checkPermission('canViewProgressiveTokenConsumption')
    ) {
      fetchConsumptionData();
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status]);

  // Don't render anything while session is loading to prevent flash
  if (status === 'loading') {
    return null;
  }

  // Check if user has permission to view progressive token consumption
  if (!checkPermission('canViewProgressiveTokenConsumption')) {
    return null; // Don't render the widget if user doesn't have permission
  }

  const fetchConsumptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/dashboard/progressive-consumption?_t=${Date.now()}`
      );
      if (response.ok) {
        const result = await response.json();
        console.log('🎨 Progressive Consumption Widget received data:');
        console.log('  Current Month:', result.currentMonth?.consumed, 'kWh');
        console.log('  Previous Month:', result.previousMonth?.consumed, 'kWh');
        console.log('  Trend:', result.trendPercentage, '%');
        console.log('  Full data:', result);
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch consumption data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Progressive Token Consumption
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No consumption data available
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Add some token purchases and contributions to see your consumption
            trends
          </p>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'up':
        return 'text-red-500';
      case 'down':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Progressive Token Consumption
        </h3>
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {data.trendPercentage > 0 && '+'}
            {data.trendPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Period Overview */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {data.currentMonth.period}
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data.currentMonth.consumed.toFixed(2)} kWh
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-1">
                ${data.currentMonth.totalContributed.toFixed(2)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-300">
                Total Contributed
              </div>
            </div>

            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-semibold text-green-700 dark:text-green-400 mb-1">
                ${data.currentMonth.costPerKwh.toFixed(3)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-300">
                Cost per kWh
              </div>
            </div>
          </div>
        </div>

        {/* Comparison with Previous Period */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            vs. Previous Month
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Usage:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {data.previousMonth.consumed.toLocaleString()} kWh
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Contributed:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ${data.previousMonth.totalContributed.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Cost/kWh:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ${data.previousMonth.costPerKwh.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Historical Data - All Time */}
        <div className="pt-4 border-t-2 border-gray-300 dark:border-gray-600 mt-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
            Historical Summary (All Time)
          </h4>

          {/* Total Purchased */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-base font-bold text-blue-700 dark:text-blue-400 mb-2">
                <span className="whitespace-nowrap">{data.historical.totalPurchasedTokens.toLocaleString()}</span>{' '}
                <span>kWh</span>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-300 mb-1">
                Total Purchased
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-400">
                ${data.historical.totalPurchasedCost.toFixed(2)}
              </div>
            </div>

            {/* Total Consumed */}
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-base font-bold text-red-700 dark:text-red-400 mb-2">
                <span className="whitespace-nowrap">{data.historical.totalConsumedTokens.toLocaleString()}</span>{' '}
                <span>kWh</span>
              </div>
              <div className="text-sm text-red-600 dark:text-red-300 mb-1">
                Total Consumed
              </div>
              <div className="text-xs text-red-500 dark:text-red-400">
                ${data.historical.totalConsumedCost.toFixed(2)}
              </div>
            </div>

            {/* Average Cost */}
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-base font-bold text-green-700 dark:text-green-400 mb-2 whitespace-nowrap">
                ${data.historical.averageCostPerKwhAllTime.toFixed(3)}
              </div>
              <div className="text-sm text-green-600 dark:text-green-300">
                Average Cost/kWh
              </div>
              <div className="text-xs text-green-500 dark:text-green-400">
                All Time
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
