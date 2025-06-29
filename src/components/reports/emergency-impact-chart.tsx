'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Loader2, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface EmergencyImpactChartProps {
  startDate?: string;
  endDate?: string;
}

interface EmergencyAnalysis {
  date: string;
  totalTokens: number;
  totalPayment: number;
  emergencyRate: number;
  baseRate: number;
  premium: number;
  premiumCost: number;
  premiumPercentage: number;
  utilizationRate: number;
}

interface ImpactSummary {
  totalPurchases: number;
  regularPurchases: number;
  emergencyPurchases: number;
  emergencyRate: number;
  baseRate: number;
  averageEmergencyRate: number;
  totalEmergencyPremium: number;
  emergencyTokenPercentage: number;
}

interface EmergencyImpactData {
  impactSummary: ImpactSummary;
  emergencyAnalysis: EmergencyAnalysis[];
  comparison: {
    regularPurchases: number;
    emergencyPurchases: number;
    totalPremiumPaid: number;
  };
}

export function EmergencyImpactChart({ startDate, endDate }: EmergencyImpactChartProps) {
  const [data, setData] = useState<EmergencyImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'premium' | 'comparison'>('premium');

  useEffect(() => {
    fetchEmergencyImpact();
  }, [startDate, endDate]);

  const fetchEmergencyImpact = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', 'emergency-impact');
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());

      const response = await fetch(`/api/reports/usage?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch emergency impact analysis');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching emergency impact:', error);
      setError('Failed to load emergency impact analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading emergency impact analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchEmergencyImpact} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.emergencyAnalysis.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Emergency Purchase Data
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          No emergency purchases found for the selected time period.
        </p>
      </div>
    );
  }

  // Prepare chart data
  const labels = data.emergencyAnalysis.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const premiumChartData = {
    labels,
    datasets: [
      {
        label: 'Premium Cost ($)',
        data: data.emergencyAnalysis.map(item => item.premiumCost),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
        yAxisID: 'y',
      },
      {
        label: 'Premium Percentage (%)',
        data: data.emergencyAnalysis.map(item => item.premiumPercentage),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.1,
        yAxisID: 'y1',
      },
    ],
  };

  const comparisonChartData = {
    labels: ['Regular Purchases', 'Emergency Purchases'],
    datasets: [
      {
        label: 'Number of Purchases',
        data: [data.comparison.regularPurchases, data.comparison.emergencyPurchases],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      },
    ],
  };

  const premiumChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Emergency Purchase Premium Analysis',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Purchase Date',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Premium Cost ($)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Premium Percentage (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const comparisonChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Purchase Type Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Purchases',
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Emergency Purchase Impact Analysis
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Analyze the financial impact and patterns of emergency electricity purchases
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={chartView === 'premium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartView('premium')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Premium Analysis
          </Button>
          <Button
            variant={chartView === 'comparison' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartView('comparison')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Purchase Comparison
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            {data.impactSummary.emergencyRate.toFixed(1)}%
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Emergency Purchase Rate</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            ${data.impactSummary.totalEmergencyPremium.toFixed(2)}
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300">Total Premium Paid</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            ${data.impactSummary.baseRate.toFixed(4)}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Base Rate per Token</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            ${data.impactSummary.averageEmergencyRate.toFixed(4)}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Avg Emergency Rate</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
        {chartView === 'premium' ? (
          <Line data={premiumChartData} options={premiumChartOptions} />
        ) : (
          <Bar data={comparisonChartData} options={comparisonChartOptions} />
        )}
      </div>

      {/* Impact Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Impact Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-red-600" />
            Cost Impact Breakdown
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Regular Purchases:</span>
              <span className="font-medium">{data.impactSummary.regularPurchases}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Emergency Purchases:</span>
              <span className="font-medium text-red-600">{data.impactSummary.emergencyPurchases}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Average Premium:</span>
              <span className="font-medium">
                ${data.impactSummary.emergencyPurchases > 0 
                  ? ((data.impactSummary.averageEmergencyRate - data.impactSummary.baseRate)).toFixed(4)
                  : '0.0000'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-slate-600 dark:text-slate-400">Total Premium Cost:</span>
              <span className="font-medium text-red-600">
                ${data.impactSummary.totalEmergencyPremium.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Emergency Token %:</span>
              <span className="font-medium">
                {data.impactSummary.emergencyTokenPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Efficiency Insights */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            Emergency Purchase Insights
          </h4>
          <div className="space-y-4">
            {/* High premium purchases */}
            {data.emergencyAnalysis.filter(item => item.premiumPercentage > 50).length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-red-600">
                  {data.emergencyAnalysis.filter(item => item.premiumPercentage > 50).length} purchases
                </span>
                <span className="text-slate-600 dark:text-slate-400"> with &gt;50% premium</span>
              </div>
            )}

            {/* Low utilization emergency purchases */}
            {data.emergencyAnalysis.filter(item => item.utilizationRate < 80).length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-orange-600">
                  {data.emergencyAnalysis.filter(item => item.utilizationRate < 80).length} emergency purchases
                </span>
                <span className="text-slate-600 dark:text-slate-400"> with low utilization (&lt;80%)</span>
              </div>
            )}

            {/* Potential savings */}
            <div className="text-sm pt-2 border-t">
              <span className="text-slate-600 dark:text-slate-400">Potential savings if all were regular:</span>
              <div className="font-medium text-green-600">
                ${data.impactSummary.totalEmergencyPremium.toFixed(2)}
              </div>
            </div>

            {/* Emergency frequency warning */}
            {data.impactSummary.emergencyRate > 20 && (
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                <div className="text-sm text-red-800 dark:text-red-200">
                  <strong>High Emergency Rate:</strong> {data.impactSummary.emergencyRate.toFixed(1)}% of purchases are emergency.
                  Consider better planning to reduce costs.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Emergency Purchase Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Emergency Purchase Details
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tokens
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Emergency Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Premium
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Premium Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Utilization
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {data.emergencyAnalysis.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {item.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">
                    ${item.emergencyRate.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={item.premiumPercentage > 50 ? 'text-red-600 font-medium' : 'text-orange-600'}>
                      {item.premiumPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">
                    ${item.premiumCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={item.utilizationRate < 80 ? 'text-orange-600' : 'text-slate-600 dark:text-slate-400'}>
                      {item.utilizationRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}