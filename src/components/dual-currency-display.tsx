'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatZWG } from '@/lib/utils';

interface DualCurrencyDisplayProps {
  usdAmount: number;
  zwgAmount: number;
  kwhPurchased: number;
  showVariance?: boolean;
  className?: string;
}

export function DualCurrencyDisplay({
  usdAmount,
  zwgAmount,
  kwhPurchased,
  showVariance = true,
  className = '',
}: DualCurrencyDisplayProps) {
  // Calculate cost per kWh in both currencies
  const usdPerKwh = kwhPurchased > 0 ? usdAmount / kwhPurchased : 0;
  const zwgPerKwh = kwhPurchased > 0 ? zwgAmount / kwhPurchased : 0;

  // Calculate implied exchange rate (ZWG per 1 USD)
  const exchangeRate = usdAmount > 0 ? zwgAmount / usdAmount : 0;

  // Calculate variance percentage (how much more/less in USD terms)
  const variance = usdAmount > 0 ? ((zwgAmount / exchangeRate - usdAmount) / usdAmount) * 100 : 0;

  return (
    <Card className={`border-purple-200 bg-purple-50/30 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-purple-600" />
          <div>
            <CardTitle className="text-lg">Dual-Currency Analysis</CardTitle>
            <CardDescription className="text-sm">
              USD payment vs ZWG official receipt comparison
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* USD Side */}
          <div className="p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                USD (Internal Payment)
              </h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ${usdAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cost per kWh</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  ${usdPerKwh.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* ZWG Side */}
          <div className="p-4 bg-white rounded-lg border border-blue-200 dark:bg-gray-800 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600 font-bold text-sm">ZWG</span>
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Official Receipt
              </h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatZWG(zwgAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cost per kWh</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {formatZWG(zwgPerKwh)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="p-3 bg-white rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Implied Exchange Rate</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                1 USD = {formatZWG(exchangeRate)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">For {kwhPurchased.toFixed(2)} kWh</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {((zwgAmount / usdAmount) || 0).toFixed(2)} ZWG/USD
              </p>
            </div>
          </div>
        </div>

        {/* Variance Indicator */}
        {showVariance && Math.abs(variance) > 0.01 && (
          <div
            className={`p-3 rounded-md text-sm ${
              Math.abs(variance) > 5
                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {variance > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {Math.abs(variance) > 5 ? '⚠️ ' : '✓ '}
                  Cost Variance: {variance > 0 ? '+' : ''}
                  {variance.toFixed(2)}%
                </p>
                <p className="text-xs mt-1">
                  {variance > 0
                    ? 'ZWG cost is higher than USD equivalent when converted'
                    : 'ZWG cost is lower than USD equivalent when converted'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* kWh Summary */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm dark:bg-gray-800">
          <span className="text-gray-600 dark:text-gray-400">Energy Purchased:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {kwhPurchased.toFixed(2)} kWh
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
