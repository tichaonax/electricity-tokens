'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DualCurrencyChart } from '@/components/reports/dual-currency-chart';
import { ZWGRateHistory } from '@/components/reports/zwg-rate-history';
import { PurchaseComparisonChart } from '@/components/reports/purch-comparison-chart';
// Form components removed as they're not used in this component
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  AlertTriangle,
  Calculator,
  BarChart3,
  PieChart,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface CostBreakdown {
  totalTokensUsed: number;
  totalAmountPaid: number;
  totalTrueCost: number;
  averageCostPerKwh: number;
  efficiency: number;
  overpayment: number;
  emergencyPremium: number;
  regularCostPerKwh: number;
  emergencyCostPerKwh: number;
}

interface Recommendation {
  recommendations: string[];
  efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  potentialSavings: number;
}

interface CostAnalysisProps {
  userId?: string;
  isAdmin?: boolean;
  showRecommendations?: boolean;
  showOptimalContributions?: boolean;
}

export function CostAnalysis({ userId }: CostAnalysisProps) {
  // Helper function to get default date range (show all data by default)
  const getDefaultDateRange = () => {
    return {
      startDate: '',
      endDate: '',
    };
  };

  const [costData, setCostData] = useState<CostBreakdown | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation | null>(
    null
  );
  const [optimalContributions, setOptimalContributions] = useState<
    {
      purchaseId: string;
      purchaseDate: string;
      isEmergency: boolean;
      actualContribution: number;
      tokensConsumed: number;
      baseContribution: number;
      emergencyPenalty: number;
      totalOptimalContribution: number;
      costPerKwh: number;
      difference: number;
    }[]
  >([]);
  const [purchaseComparison, setPurchaseComparison] = useState<{
    purchases: {
      purchaseId: string;
      purchaseDate: string;
      contributionAmount: number;
      trueCost: number;
      totalElectricityCost: number;
      tokensConsumed: number;
      totalTokensInPurchase: number;
      difference: number;
      isEmergency: boolean;
      costPerKwh: number;
    }[];
    summary: {
      totalContributions: number;
      totalTrueCost: number;
      totalElectricityCost: number;
      totalDifference: number;
      averageEfficiency: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<
    'user' | 'comparison' | 'recommendations' | 'optimal' | 'dual-currency' | 'rate-history'
  >('user');
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const fetchCostAnalysis = useCallback(async () => {
    // Only skip API fetch for analysis types that don't use the cost-analysis endpoint
    if (analysisType === 'dual-currency' || analysisType === 'rate-history') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        analysisType: analysisType === 'comparison' ? 'comparison' : 'user', // Use 'comparison' for API calls when needed
        // Note: userId is intentionally not passed to show global data
        // ...(userId && { userId }),
        ...(dateRange.startDate && {
          startDate: new Date(dateRange.startDate).toISOString(),
        }),
        ...(dateRange.endDate && {
          endDate: new Date(dateRange.endDate).toISOString(),
        }),
      });

      const response = await fetch(`/api/cost-analysis?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cost analysis');
      }

      const data = await response.json();

      if (analysisType === 'user') {
        setCostData(data.costBreakdown);
      } else if (analysisType === 'comparison') {
        setPurchaseComparison(data.purchaseComparison);
      } else if (analysisType === 'recommendations') {
        setCostData(data.user);
        setRecommendations(data.recommendations);
      } else if (analysisType === 'optimal') {
        setOptimalContributions(data.optimalContributions || []);
      }
    } catch (error) {
      // console.error removed
      setError(
        error instanceof Error ? error.message : 'Failed to load cost analysis'
      );
    } finally {
      setLoading(false);
    }
  }, [analysisType, dateRange]);

  useEffect(() => {
    // Only fetch data when analysisType changes, not when dates change
    // Users must click "Refresh" to fetch with new dates
    if (analysisType !== 'dual-currency' && analysisType !== 'rate-history') {
      fetchCostAnalysis();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisType]); // Only re-fetch when analysis type changes

  const handleShowAll = useCallback(() => {
    setDateRange({ startDate: '', endDate: '' });
    // Small delay to ensure state updates before fetching
    setTimeout(() => fetchCostAnalysis(), 100);
  }, [fetchCostAnalysis]);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return 'text-green-600';
    if (efficiency >= 85) return 'text-blue-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyIcon = (efficiency: number) => {
    if (efficiency >= 95) return <Award className="h-5 w-5 text-green-600" />;
    if (efficiency >= 85)
      return <CheckCircle className="h-5 w-5 text-blue-600" />;
    if (efficiency >= 70)
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-600 dark:text-slate-400">
            Loading cost analysis...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Cost Analysis & Recommendations
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Detailed breakdown of your electricity costs and usage efficiency
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Analysis Type Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAnalysisType('user')}
            className="flex-1 sm:flex-none"
          >
            <Calculator className="h-4 w-4 mr-1" />
            Cost Breakdown
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAnalysisType('comparison')}
            className="flex-1 sm:flex-none"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Payment Comparison
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAnalysisType('recommendations')}
            className="flex-1 sm:flex-none"
          >
            <Target className="h-4 w-4 mr-1" />
            Recommendations
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAnalysisType('optimal')}
            className="flex-1 sm:flex-none"
          >
            <PieChart className="h-4 w-4 mr-1" />
            Optimal Contributions
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAnalysisType('dual-currency')}
            className="flex-1 sm:flex-none"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            USD vs ZWG
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAnalysisType('rate-history')}
            className="flex-1 sm:flex-none"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Rate History
          </Button>
        </div>

        {/* Date Range Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="date"
            placeholder="Start Date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="flex-1 sm:max-w-40"
          />
          <Input
            type="date"
            placeholder="End Date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="flex-1 sm:max-w-40"
          />
          <Button
            type="button"
            onClick={fetchCostAnalysis}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Refresh
          </Button>
          <Button
            type="button"
            onClick={handleShowAll}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            Show All
          </Button>
        </div>
      </div>

      {/* Cost Breakdown Display */}
      {(analysisType === 'user' || analysisType === 'recommendations') && costData && (
        <div className="mb-6">
          {costData.totalTokensUsed === 0 && costData.totalAmountPaid === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                No Cost Data Available
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {dateRange.startDate || dateRange.endDate
                  ? "No contributions found for the selected date range. Try adjusting your date filters or select 'Show All' to view all your data."
                  : "You haven't made any contributions yet. Start by making a purchase to see your cost analysis."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Usage */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Total Usage
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {costData.totalTokensUsed.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      kWh
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
              </div>

            {/* Total Paid */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Total Paid
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    ${costData.totalAmountPaid.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Contributions
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            {/* True Cost */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-950 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    True Cost
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    ${costData.totalTrueCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Based on usage
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            {/* Efficiency */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Efficiency
                  </p>
                  <p
                    className={`text-2xl font-bold ${getEfficiencyColor(costData.efficiency)}`}
                  >
                    {costData.efficiency.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Payment accuracy
                  </p>
                </div>
                {getEfficiencyIcon(costData.efficiency)}
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Detailed Metrics */}
      {(analysisType === 'user' || analysisType === 'recommendations') &&
        costData &&
        costData.totalTokensUsed > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Cost Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Cost Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Average Cost/kWh:
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    ${costData.averageCostPerKwh.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Regular Rate:
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    ${costData.regularCostPerKwh.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Emergency Rate:
                  </span>
                  <span className="font-medium text-red-600">
                    ${costData.emergencyCostPerKwh.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Emergency Premium:
                  </span>
                  <span className="font-medium text-red-600">
                    ${costData.emergencyPremium.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Analysis */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Payment Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">
                    Over/Under Payment:
                  </span>
                  <div className="flex items-center gap-2">
                    {costData.overpayment >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${costData.overpayment >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      ${Math.abs(costData.overpayment).toFixed(2)}
                      {costData.overpayment >= 0 ? ' overpaid' : ' underpaid'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Payment Efficiency:
                  </span>
                  <span
                    className={`font-medium ${getEfficiencyColor(costData.efficiency)}`}
                  >
                    {costData.efficiency.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      {analysisType === 'recommendations' && recommendations && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Recommendations
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Efficiency Status */}
            <div
              className={`p-4 rounded-lg border ${
                recommendations.efficiency === 'excellent'
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                  : recommendations.efficiency === 'good'
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                    : recommendations.efficiency === 'fair'
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getEfficiencyIcon(costData?.efficiency || 0)}
                <span className="font-medium capitalize text-slate-900 dark:text-slate-100">
                  {recommendations.efficiency} Efficiency
                </span>
              </div>
              {recommendations.potentialSavings > 0 && (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Potential savings:{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    ${recommendations.potentialSavings.toFixed(2)}
                  </span>
                </p>
              )}
            </div>

            {/* Recommendations List */}
            <div className="space-y-2">
              {recommendations.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 border border-slate-200 rounded dark:bg-slate-800 dark:border-slate-700"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optimal Contributions */}
      {analysisType === 'optimal' && optimalContributions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Optimal vs Actual Contributions
          </h3>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-2 text-slate-900 dark:text-slate-100">
                    Purchase Date
                  </th>
                  <th className="text-left p-2 text-slate-900 dark:text-slate-100">
                    Type
                  </th>
                  <th className="text-right p-2 text-slate-900 dark:text-slate-100">
                    Tokens
                  </th>
                  <th className="text-right p-2 text-slate-900 dark:text-slate-100">
                    Actual
                  </th>
                  <th className="text-right p-2 text-slate-900 dark:text-slate-100">
                    Optimal
                  </th>
                  <th className="text-right p-2 text-slate-900 dark:text-slate-100">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody>
                {optimalContributions.map((contrib, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="p-2 text-slate-900 dark:text-slate-100">
                      {new Date(contrib.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          contrib.isEmergency
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {contrib.isEmergency ? 'Emergency' : 'Regular'}
                      </span>
                    </td>
                    <td className="text-right p-2 text-slate-900 dark:text-slate-100">
                      {contrib.tokensConsumed.toFixed(2)}
                    </td>
                    <td className="text-right p-2 text-slate-900 dark:text-slate-100">
                      ${contrib.actualContribution.toFixed(2)}
                    </td>
                    <td className="text-right p-2 text-slate-900 dark:text-slate-100">
                      ${contrib.totalOptimalContribution.toFixed(2)}
                    </td>
                    <td
                      className={`text-right p-2 font-medium ${
                        contrib.difference > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {contrib.difference > 0 ? '+' : ''}$
                      {contrib.difference.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {optimalContributions.map((contrib, index) => (
              <div
                key={index}
                className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {new Date(contrib.purchaseDate).toLocaleDateString()}
                    </div>
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                        contrib.isEmergency
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {contrib.isEmergency ? 'Emergency' : 'Regular'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {contrib.tokensConsumed.toFixed(2)} kWh
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Actual
                    </div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      ${contrib.actualContribution.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Optimal
                    </div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      ${contrib.totalOptimalContribution.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Difference
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        contrib.difference > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {contrib.difference > 0 ? '+' : ''}$
                      {contrib.difference.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dual Currency Analysis View */}
      {analysisType === 'dual-currency' && (
        <div className="mt-6">
          <DualCurrencyChart 
            userId={userId}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </div>
      )}

      {/* Rate History View */}
      {analysisType === 'rate-history' && (
        <div className="mt-6">
          <ZWGRateHistory userId={userId} limit={50} />
        </div>
      )}

      {/* Purchase Comparison View */}
      {analysisType === 'comparison' && purchaseComparison && (
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Contributions</p>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    ${purchaseComparison.summary.totalContributions.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Total True Cost</p>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                    ${purchaseComparison.summary.totalTrueCost.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">Total Electricity Cost</p>
                  <p className="text-lg font-semibold text-red-900 dark:text-red-100">
                    ${purchaseComparison.summary.totalElectricityCost.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-lg ${
              purchaseComparison.summary.totalDifference >= 0
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center">
                <Target className={`h-5 w-5 mr-2 ${
                  purchaseComparison.summary.totalDifference >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <div>
                  <p className={`text-sm ${
                    purchaseComparison.summary.totalDifference >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    Net Position
                  </p>
                  <p className={`text-lg font-semibold ${
                    purchaseComparison.summary.totalDifference >= 0
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    ${Math.abs(purchaseComparison.summary.totalDifference).toFixed(2)}
                    {purchaseComparison.summary.totalDifference >= 0 ? ' surplus' : ' deficit'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Average Efficiency</p>
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                    {purchaseComparison.summary.averageEfficiency.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Payment Comparison: Contribution vs. True Cost
            </h3>
            <PurchaseComparisonChart data={purchaseComparison} />
          </div>
        </div>
      )}
    </div>
  );
}
