'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatZWG } from '@/lib/utils';

interface AnalysisResult {
  summary: {
    totalReceipts: number;
    dateRange: { start: string; end: string } | null;
    avgZWGPerKwh: number;
    minZWGPerKwh: number;
    maxZWGPerKwh: number;
    totalKwhPurchased: number;
    totalZWGSpent: number;
    avgUSDPerKwh: number;
    impliedExchangeRate: number;
  };
  trends: {
    overall: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    monthlyTrends: Array<{
      period: string;
      date: string;
      avgZWGPerKwh: number;
      minZWGPerKwh: number;
      maxZWGPerKwh: number;
      totalKwh: number;
      purchaseCount: number;
    }>;
  };
  anomalies: Array<{
    id: string;
    date: string;
    zwgPerKwh: number;
    deviation: number;
    type: 'spike' | 'drop';
    severity: 'low' | 'medium' | 'high';
  }>;
  seasonal: Array<{
    month: number;
    avgZWGPerKwh: number;
    purchaseCount: number;
    totalKwh: number;
  }>;
  recommendations: string[];
  variance: {
    usdVsZwg: number;
    overpaymentPercentage: number;
  };
}

export function InsightsCard() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/receipt-data/analyze-historical');

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-purple-200 bg-purple-50/30">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-2 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.summary.totalReceipts === 0) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            Electricity Insights
          </CardTitle>
          <CardDescription>Import receipts to get personalized insights</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            📊 No receipt data available yet. Import your historical receipts to see pricing
            trends, anomalies, and recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary, trends, anomalies, recommendations, variance } = analysis;

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader
        className="cursor-pointer hover:bg-purple-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle className="text-lg">Electricity Insights</CardTitle>
              <CardDescription className="text-sm mt-1">
                Based on {summary.totalReceipts} receipts
                {summary.dateRange && (
                  <span className="ml-1">
                    ({new Date(summary.dateRange.start).toLocaleDateString()} -{' '}
                    {new Date(summary.dateRange.end).toLocaleDateString()})
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" type="button">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Average Rate */}
          <div className="p-3 bg-white rounded-lg border border-purple-100">
            <p className="text-xs text-gray-500 mb-1">Average Rate</p>
            <p className="text-xl font-bold text-purple-700">
              {formatZWG(summary.avgZWGPerKwh)}/kWh
            </p>
            <p className="text-xs text-gray-600 mt-1">
              ${summary.avgUSDPerKwh.toFixed(4)}/kWh (USD)
            </p>
          </div>

          {/* Price Trend */}
          <div className="p-3 bg-white rounded-lg border border-purple-100">
            <p className="text-xs text-gray-500 mb-1">Price Trend</p>
            <div className="flex items-center gap-2">
              {trends.overall === 'increasing' ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : trends.overall === 'decreasing' ? (
                <TrendingDown className="h-5 w-5 text-green-500" />
              ) : (
                <Minus className="h-5 w-5 text-gray-500" />
              )}
              <span className="text-lg font-semibold">
                {trends.overall === 'increasing' && 'Rising'}
                {trends.overall === 'decreasing' && 'Falling'}
                {trends.overall === 'stable' && 'Stable'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {trends.percentageChange > 0 ? '+' : ''}
              {trends.percentageChange.toFixed(1)}% change
            </p>
          </div>

          {/* Anomalies */}
          <div className="p-3 bg-white rounded-lg border border-purple-100">
            <p className="text-xs text-gray-500 mb-1">Price Anomalies</p>
            <p className="text-xl font-bold text-purple-700">{anomalies.length}</p>
            <p className="text-xs text-gray-600 mt-1">
              {anomalies.filter((a) => a.severity === 'high').length} high severity
            </p>
          </div>
        </div>

        {/* Variance */}
        <div
          className={`p-3 rounded-lg border ${
            variance.overpaymentPercentage > 5
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <p className="text-sm font-medium mb-1">
            {variance.overpaymentPercentage > 0 ? 'Overpayment' : 'Underpayment'} Analysis
          </p>
          <p className="text-xs">
            You {variance.overpaymentPercentage > 0 ? 'paid' : 'saved'}{' '}
            {Math.abs(variance.overpaymentPercentage).toFixed(1)}% more in USD compared to ZWG
            true cost ({variance.usdVsZwg > 0 ? '+' : ''}${variance.usdVsZwg.toFixed(2)})
          </p>
        </div>

        {/* Recommendations (always show top 2) */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">💡 Recommendations</p>
            {recommendations.slice(0, isExpanded ? undefined : 2).map((rec, i) => (
              <div
                key={i}
                className="p-2 bg-white rounded border border-blue-100 text-sm text-gray-700"
              >
                {rec}
              </div>
            ))}
            {!isExpanded && recommendations.length > 2 && (
              <p className="text-xs text-gray-500">
                +{recommendations.length - 2} more recommendations (click to expand)
              </p>
            )}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <>
            {/* Monthly Trends */}
            {trends.monthlyTrends.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-purple-200">
                <p className="text-sm font-medium text-gray-700">📈 Monthly Trends</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {trends.monthlyTrends.slice(-6).map((trend, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 bg-white rounded"
                    >
                      <span className="text-gray-600">
                        {new Date(trend.date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="font-medium">
                        {formatZWG(trend.avgZWGPerKwh)}/kWh
                      </span>
                      <span className="text-gray-500">({trend.purchaseCount} purchases)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Anomalies */}
            {anomalies.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-purple-200">
                <p className="text-sm font-medium text-gray-700">⚠️ Recent Anomalies</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {anomalies.slice(-5).map((anomaly) => (
                    <div
                      key={anomaly.id}
                      className={`flex items-center justify-between text-xs p-2 rounded ${
                        anomaly.type === 'spike' ? 'bg-red-50' : 'bg-green-50'
                      }`}
                    >
                      <span className="text-gray-600">
                        {new Date(anomaly.date).toLocaleDateString()}
                      </span>
                      <span className="font-medium">{formatZWG(anomaly.zwgPerKwh)}/kWh</span>
                      <span
                        className={
                          anomaly.type === 'spike' ? 'text-red-700' : 'text-green-700'
                        }
                      >
                        {anomaly.deviation > 0 ? '+' : ''}
                        {anomaly.deviation.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
