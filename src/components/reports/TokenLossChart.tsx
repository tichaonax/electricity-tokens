'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, DollarSign, AlertTriangle, Target } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TokenLossChartProps {
  startDate?: Date;
  endDate?: Date;
}

interface TokenLossData {
  summary: {
    totalTokens: number;
    totalSpent: number;
    emergencyTokens: number;
    emergencySpent: number;
    regularTokens: number;
    regularSpent: number;
    avgRegularRate: number;
    avgEmergencyRate: number;
    potentialSavings: number;
    tokenLossPercentage: number;
    emergencyPremium: number;
  };
  monthlyBreakdown: Array<{
    month: string;
    regularTokens: number;
    emergencyTokens: number;
    regularSpent: number;
    emergencySpent: number;
    potentialSavings: number;
    lossPercentage: number;
    regularRate: number;
    emergencyRate: number;
  }>;
  insights: {
    totalEmergencyPurchases: number;
    totalRegularPurchases: number;
    emergencyFrequency: number;
    averageSavingsPerEmergency: number;
  };
}

export default function TokenLossChart({ startDate, endDate }: TokenLossChartProps) {
  const [data, setData] = useState<TokenLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: 'token-loss',
      });

      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/reports/efficiency?${params}`);
      if (!response.ok) throw new Error('Failed to fetch data');

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Error loading token loss data: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No token loss data available for the selected period.</AlertDescription>
      </Alert>
    );
  }

  // Prepare chart data
  const monthlyChartData = {
    labels: data.monthlyBreakdown.map(item => {
      const date = new Date(item.month + '-01');
      return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Potential Savings',
        data: data.monthlyBreakdown.map(item => item.potentialSavings),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: 'Loss Percentage',
        data: data.monthlyBreakdown.map(item => item.lossPercentage),
        backgroundColor: 'rgba(251, 146, 60, 0.7)',
        borderColor: 'rgba(251, 146, 60, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const distributionChartData = {
    labels: ['Regular Purchases', 'Emergency Purchases'],
    datasets: [
      {
        data: [data.summary.regularSpent, data.summary.emergencySpent],
        backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)'],
        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Token Loss Analysis',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Potential Savings ($)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Loss Percentage (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const distributionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Spending Distribution',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loss Percentage</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.summary.tokenLossPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Due to emergency purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.summary.potentialSavings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              If emergency purchases were regular
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Premium</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${data.summary.emergencyPremium.toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per token premium
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Frequency</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.insights.emergencyFrequency.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of all purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Loss Analysis</CardTitle>
              <CardDescription>
                Track potential savings and loss percentage over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Bar data={monthlyChartData} options={chartOptions} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Spending Distribution</CardTitle>
              <CardDescription>
                Regular vs emergency purchase spending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Doughnut data={distributionChartData} options={distributionOptions} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Impact Analysis
              </h4>
              <div className="space-y-1 text-sm">
                <p>Emergency purchases: {data.insights.totalEmergencyPurchases} of {data.insights.totalEmergencyPurchases + data.insights.totalRegularPurchases} total</p>
                <p>Average loss per emergency: ${data.insights.averageSavingsPerEmergency.toFixed(2)}</p>
                <p>Emergency tokens: {data.summary.emergencyTokens.toFixed(2)} of {data.summary.totalTokens.toFixed(2)} total</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Optimization Opportunities
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Regular rate:</span>
                  <Badge variant="secondary">${data.summary.avgRegularRate.toFixed(4)}/token</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Emergency rate:</span>
                  <Badge variant="destructive">${data.summary.avgEmergencyRate.toFixed(4)}/token</Badge>
                </div>
                <p className="pt-2 text-xs text-muted-foreground">
                  Reducing emergency purchases could save ${data.summary.potentialSavings.toFixed(2)} 
                  ({data.summary.tokenLossPercentage.toFixed(1)}% efficiency gain)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}