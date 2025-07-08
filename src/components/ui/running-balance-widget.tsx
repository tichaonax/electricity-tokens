'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface BalanceData {
  contributionBalance: number;
  totalContributed: number;
  totalConsumed: number;
  totalFairShareCost: number;
  averageDaily: number;
  status: 'healthy' | 'warning' | 'critical';
  lastWeekConsumption: number;
  lastWeekContributed: number;
  consumptionTrend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  // New fields for anticipated payment
  tokensConsumedSinceLastContribution: number;
  estimatedCostSinceLastContribution: number;
  anticipatedPayment: number;
  historicalCostPerKwh: number;
  // NEW: Anticipated others payment fields
  anticipatedOthersPayment: number;
  anticipatedTokenPurchase: number;
}

export function RunningBalanceWidget() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { checkPermission } = usePermissions();

  // Check if user has permission to view account balance
  if (!checkPermission('canViewAccountBalance')) {
    return null; // Don't render the widget if user doesn't have permission
  }

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      // Add cache-busting parameters to ensure fresh data after database reset
      const cacheBuster = new URLSearchParams({
        t: Date.now().toString(),
        v: 'fresh'
      });
      const response = await fetch(`/api/dashboard/running-balance?${cacheBuster}`, {
        // Force fresh fetch, bypassing cache
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const errorText = await response.text();
        console.error('Running balance API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to fetch balance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Running Balance
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No balance data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Start by adding token purchases to track your running balance
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (data.status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (data.status) {
      case 'healthy':
        return <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTrendIcon = () => {
    switch (data.consumptionTrend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (data.status) {
      case 'healthy':
        return data.contributionBalance >= 0 ? 'Credit available' : 'Balanced';
      case 'warning':
        return 'Amount owed';
      case 'critical':
        return 'Significant debt';
      default:
        return 'Balance status unknown';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Account Balance
        </h3>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusMessage()}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Account Balance */}
        <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className={`text-3xl font-bold mb-1 ${
            data.contributionBalance >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {data.contributionBalance < 0 ? '-' : ''}${Math.abs(data.contributionBalance).toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Account Balance
          </div>
          <div className={`text-xs mt-1 ${
            data.contributionBalance >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {data.contributionBalance >= 0 ? 'credit' : 'owed'}
          </div>
        </div>
        
        {/* NEW: Anticipated Payment Predictions Section - Similar to Historical Summary */}
        <div className="pt-4 border-t-2 border-gray-300 dark:border-gray-600 mt-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
            Anticipated Payment Analysis
          </h4>

          {/* Three Payment Predictions in Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Anticipated Next Payment */}
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className={`text-2xl font-bold mb-1 ${
                data.anticipatedPayment < 0 
                  ? 'text-red-700 dark:text-red-400' 
                  : 'text-green-700 dark:text-green-400'
              }`}>
                {data.anticipatedPayment < 0 ? '-' : ''}${Math.abs(data.anticipatedPayment).toFixed(2)}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-300 mb-1">
                Anticipated Next Payment
              </div>
              <div className={`text-xs ${
                data.anticipatedPayment < 0 
                  ? 'text-red-500 dark:text-red-400' 
                  : 'text-green-500 dark:text-green-400'
              }`}>
                {data.anticipatedPayment < 0 ? 'payment due' : 'credit expected'}
              </div>
            </div>

            {/* Anticipated Others Payment */}
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className={`text-2xl font-bold mb-1 ${
                data.anticipatedOthersPayment < 0 
                  ? 'text-red-700 dark:text-red-400' 
                  : 'text-green-700 dark:text-green-400'
              }`}>
                {data.anticipatedOthersPayment < 0 ? '-' : ''}${Math.abs(data.anticipatedOthersPayment).toFixed(2)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-300 mb-1">
                Anticipated Others Payment
              </div>
              <div className={`text-xs ${
                data.anticipatedOthersPayment < 0 
                  ? 'text-red-500 dark:text-red-400' 
                  : 'text-green-500 dark:text-green-400'
              }`}>
                {data.anticipatedOthersPayment < 0 ? 'contribution due' : 'credit expected'}
              </div>
            </div>

            {/* Anticipated Token Purchase */}
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className={`text-2xl font-bold mb-1 ${
                data.anticipatedTokenPurchase < 0 
                  ? 'text-red-700 dark:text-red-400' 
                  : 'text-green-700 dark:text-green-400'
              }`}>
                {data.anticipatedTokenPurchase < 0 ? '-' : ''}${Math.abs(data.anticipatedTokenPurchase).toFixed(2)}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-300 mb-1">
                Anticipated Token Purchase
              </div>
              <div className={`text-xs ${
                data.anticipatedTokenPurchase < 0 
                  ? 'text-red-500 dark:text-red-400' 
                  : 'text-green-500 dark:text-green-400'
              }`}>
                {data.anticipatedTokenPurchase < 0 ? 'total amount' : 'total credit'}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Since Last Contribution */}
        <div className="py-3 px-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
            Usage Since Last Contribution
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-orange-600 dark:text-orange-300">
                Tokens Consumed
              </span>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                {data.tokensConsumedSinceLastContribution.toFixed(1)} kWh
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-orange-600 dark:text-orange-300">
                Estimated Cost
              </span>
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                ${data.estimatedCostSinceLastContribution.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-orange-600 dark:text-orange-300">
                Rate (Historical Avg)
              </span>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                ${data.historicalCostPerKwh.toFixed(3)}/kWh
              </span>
            </div>
          </div>
        </div>

        {/* Balance Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xl font-semibold text-blue-700 dark:text-blue-400 mb-1">
              ${data.totalContributed.toFixed(2)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-300">
              Total Contributed
            </div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-xl font-semibold text-orange-700 dark:text-orange-400 mb-1">
              ${data.totalFairShareCost.toFixed(2)}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-300">
              Fair Share Cost
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Average Daily Usage
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {data.averageDaily.toFixed(1)} kWh
                </span>
                {getTrendIcon()}
                {data.consumptionTrend !== 'stable' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {data.trendPercentage > 0 && '+'}
                    {data.trendPercentage.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Consumption
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {data.totalConsumed.toLocaleString()} kWh
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Last Week Usage
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {data.lastWeekConsumption.toFixed(1)} kWh
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Last Week Contribution
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                ${data.lastWeekContributed.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}