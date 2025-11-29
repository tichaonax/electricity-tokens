'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Clock, Lightbulb, AlertTriangle } from 'lucide-react';
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
  RadialLinearScale,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
);

interface PurchaseTimingChartProps {
  startDate?: Date;
  endDate?: Date;
}

interface TimingData {
  monthlyAnalysis: Array<{
    month: string;
    purchases: number;
    totalTokens: number;
    totalConsumed: number;
    emergencyPurchases: number;
    avgUtilization: number;
    emergencyRate: number;
  }>;
  weeklyAnalysis: Array<{
    dayOfWeek: number;
    dayName: string;
    purchases: number;
    emergencyPurchases: number;
    avgTokens: number;
    emergencyRate: number;
  }>;
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    impact: string;
  }>;
  insights: {
    bestPurchaseDay: string;
    worstPurchaseDay: string;
    avgMonthlyConsumption: number;
    avgPurchaseFrequency: number;
    seasonalVariation: number;
  };
}

export default function PurchaseTimingChart({ startDate, endDate }: PurchaseTimingChartProps) {
  const [data, setData] = useState<TimingData | null>(null);
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
        type: 'purchase-timing',
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
        <AlertDescription>Error loading purchase timing data: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No purchase timing data available for the selected period.</AlertDescription>
      </Alert>
    );
  }

  // Prepare weekly chart data
  const weeklyChartData = {
    labels: data.weeklyAnalysis.map(item => item.dayName),
    datasets: [
      {
        label: 'Emergency Rate (%)',
        data: data.weeklyAnalysis.map(item => item.emergencyRate),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: 'Average Tokens',
        data: data.weeklyAnalysis.map(item => item.avgTokens),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const monthlyChartData = {
    labels: data.monthlyAnalysis.map(item => {
      const date = new Date(item.month + '-01');
      return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }),
    datasets: [
      {
        label: 'Utilization Rate (%)',
        data: data.monthlyAnalysis.map(item => item.avgUtilization),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Emergency Rate (%)',
        data: data.monthlyAnalysis.map(item => item.emergencyRate),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const weeklyOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Purchase Patterns by Day of Week',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Emergency Rate (%)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Average Tokens',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const monthlyOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Utilization and Emergency Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Percentage (%)',
        },
      },
    },
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Purchase Day</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.insights.bestPurchaseDay}
            </div>
            <p className="text-xs text-muted-foreground">
              Lowest emergency rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Consumption</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.insights.avgMonthlyConsumption}
            </div>
            <p className="text-xs text-muted-foreground">
              Average tokens per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Frequency</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.insights.avgPurchaseFrequency.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Purchases per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seasonal Variation</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.insights.seasonalVariation}
            </div>
            <p className="text-xs text-muted-foreground">
              Token usage range
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Purchase Patterns</CardTitle>
            <CardDescription>
              Emergency rates and average tokens by day of week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar data={weeklyChartData} options={weeklyOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>
              Utilization rates and emergency purchases over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar data={monthlyChartData} options={monthlyOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Optimization Recommendations
          </CardTitle>
          <CardDescription>
            Data-driven suggestions to improve your purchase timing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      <Badge variant={getPriorityColor(rec.priority) as any}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
                <div className="bg-muted p-2 rounded text-sm">
                  <strong>Impact:</strong> {rec.impact}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day-by-Day Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Purchase Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown of purchase patterns by day of week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Day</th>
                  <th className="text-right p-2">Total Purchases</th>
                  <th className="text-right p-2">Emergency Purchases</th>
                  <th className="text-right p-2">Emergency Rate</th>
                  <th className="text-right p-2">Avg Tokens</th>
                </tr>
              </thead>
              <tbody>
                {data.weeklyAnalysis.map((day, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">
                      {day.dayName}
                      {day.dayName === data.insights.bestPurchaseDay && (
                        <Badge className="ml-2" variant="secondary">Best</Badge>
                      )}
                      {day.dayName === data.insights.worstPurchaseDay && (
                        <Badge className="ml-2" variant="destructive">Worst</Badge>
                      )}
                    </td>
                    <td className="text-right p-2">{day.purchases}</td>
                    <td className="text-right p-2">{day.emergencyPurchases}</td>
                    <td className="text-right p-2">
                      <span className={`font-medium ${
                        day.emergencyRate > 30 ? 'text-red-600' : 
                        day.emergencyRate > 15 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {day.emergencyRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right p-2">{day.avgTokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}