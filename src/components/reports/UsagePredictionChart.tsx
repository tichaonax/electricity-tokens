'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  TrendingUp,
  Users,
  Activity,
  AlertTriangle,
} from 'lucide-react';
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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface UsagePredictionChartProps {
  startDate?: Date;
  endDate?: Date;
}

interface PredictionData {
  userPredictions: Array<{
    userId: string;
    userName: string;
    monthlyUsage: Array<{
      month: string;
      tokensConsumed: number;
      contributions: number;
      emergencyTokens: number;
    }>;
    totalUsage: number;
    totalContributions: number;
    averageMonthlyUsage: number;
    usageTrend: number;
    predictedNextMonth: number;
    confidenceLevel: string;
  }>;
  systemPrediction: {
    totalPredictedUsage: number;
    totalAverageUsage: number;
    systemTrend: number;
    recommendedPurchaseAmount: number;
    highConfidenceUsers: number;
    lowConfidenceUsers: number;
  };
  insights: {
    mostPredictableUser: string;
    highestGrowthUser: string;
    totalUsers: number;
    avgConfidenceLevel: number;
  };
}

export default function UsagePredictionChart({
  startDate,
  endDate,
}: UsagePredictionChartProps) {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: 'usage-prediction',
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
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <AlertDescription>
          Error loading usage prediction data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>
          No usage prediction data available for the selected period.
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare chart data
  const systemTrendData = {
    labels: ['Historical Average', 'Predicted Next Month'],
    datasets: [
      {
        label: 'Usage (Tokens)',
        data: [
          data.systemPrediction.totalAverageUsage,
          data.systemPrediction.totalPredictedUsage,
        ],
        backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)'],
        borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)'],
        borderWidth: 2,
      },
    ],
  };

  const userComparisonData = {
    labels: data.userPredictions.map((user) => user.userName),
    datasets: [
      {
        label: 'Historical Average',
        data: data.userPredictions.map((user) => user.averageMonthlyUsage),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Predicted Next Month',
        data: data.userPredictions.map((user) => user.predictedNextMonth),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Individual user trend data
  const getSelectedUserData = () => {
    if (selectedUser === 'all') return null;
    return data.userPredictions.find((user) => user.userId === selectedUser);
  };

  const selectedUserData = getSelectedUserData();
  const userTrendData = selectedUserData
    ? {
        labels: [
          ...selectedUserData.monthlyUsage.map((m) => {
            const date = new Date(m.month + '-01');
            return date.toLocaleDateString('en-GB', {
              month: 'short',
              year: 'numeric',
            });
          }),
          'Predicted',
        ],
        datasets: [
          {
            label: 'Historical Usage',
            data: [
              ...selectedUserData.monthlyUsage.map((m) => m.tokensConsumed),
              null,
            ],
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          },
          {
            label: 'Predicted Usage',
            data: [
              ...selectedUserData.monthlyUsage.map(() => null),
              selectedUserData.predictedNextMonth,
            ],
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)', // gray-400
        },
      },
      title: {
        display: true,
        text: 'Usage Predictions by User',
        color: 'rgb(209, 213, 219)', // gray-300
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(156, 163, 175)', // gray-400
        },
        grid: {
          color: 'rgb(75, 85, 99)', // gray-600
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Tokens',
          color: 'rgb(156, 163, 175)', // gray-400
        },
        ticks: {
          color: 'rgb(156, 163, 175)', // gray-400
        },
        grid: {
          color: 'rgb(75, 85, 99)', // gray-600
        },
      },
    },
  };

  const getConfidenceColor = (
    level: string
  ): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (level) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const getConfidenceText = (level: string) => {
    switch (level) {
      case 'high':
        return 'High Confidence';
      case 'medium':
        return 'Medium Confidence';
      case 'low':
        return 'Low Confidence';
      default:
        return 'Very Low Confidence';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Predicted Total Usage
            </CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.systemPrediction.totalPredictedUsage}
            </div>
            <p className="text-xs text-muted-foreground">Tokens next month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Recommended Purchase
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.systemPrediction.recommendedPurchaseAmount}
            </div>
            <p className="text-xs text-muted-foreground">
              Tokens (with 15% buffer)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              System Trend
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.systemPrediction.systemTrend > 0
                  ? 'text-orange-600'
                  : data.systemPrediction.systemTrend < 0
                    ? 'text-green-600'
                    : 'text-gray-600'
              }`}
            >
              {data.systemPrediction.systemTrend > 0 ? '+' : ''}
              {data.systemPrediction.systemTrend.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Tokens/month change</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
              High Confidence Users
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {data.systemPrediction.highConfidenceUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              of {data.insights.totalUsers} total users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              System Usage Prediction
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Overall system usage prediction vs historical average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar data={systemTrendData} options={chartOptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">
              User Comparison
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Historical vs predicted usage by user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar data={userComparisonData} options={chartOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Individual User Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            Individual User Trend Analysis
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Detailed prediction analysis for specific users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select User
            </label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users Summary</SelectItem>
                {data.userPredictions.map((user) => (
                  <SelectItem key={user.userId} value={user.userId}>
                    {user.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser === 'all' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">User</th>
                    <th className="text-right p-2">Avg Monthly</th>
                    <th className="text-right p-2">Predicted</th>
                    <th className="text-right p-2">Trend</th>
                    <th className="text-center p-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {data.userPredictions.map((user, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{user.userName}</td>
                      <td className="text-right p-2">
                        {user.averageMonthlyUsage}
                      </td>
                      <td className="text-right p-2 font-medium">
                        {user.predictedNextMonth}
                      </td>
                      <td
                        className={`text-right p-2 font-medium ${
                          user.usageTrend > 0
                            ? 'text-orange-600'
                            : user.usageTrend < 0
                              ? 'text-green-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {user.usageTrend > 0 ? '+' : ''}
                        {user.usageTrend.toFixed(1)}
                      </td>
                      <td className="text-center p-2">
                        <Badge
                          variant={getConfidenceColor(user.confidenceLevel)}
                        >
                          {getConfidenceText(user.confidenceLevel)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedUserData && userTrendData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedUserData.averageMonthlyUsage}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Historical Average
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedUserData.predictedNextMonth}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Predicted Next Month
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      selectedUserData.usageTrend > 0
                        ? 'text-orange-600'
                        : selectedUserData.usageTrend < 0
                          ? 'text-green-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {selectedUserData.usageTrend > 0 ? '+' : ''}
                    {selectedUserData.usageTrend.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Monthly Trend
                  </div>
                </div>
                <div className="text-center">
                  <Badge
                    variant={getConfidenceColor(
                      selectedUserData.confidenceLevel
                    )}
                    className="text-sm"
                  >
                    {getConfidenceText(selectedUserData.confidenceLevel)}
                  </Badge>
                </div>
              </div>
              <div className="h-64">
                <Line
                  data={userTrendData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: true,
                        text: `${selectedUserData.userName} - Usage Trend & Prediction`,
                      },
                    },
                  }}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Model Performance
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  Most predictable user:{' '}
                  <strong>{data.insights.mostPredictableUser}</strong>
                </p>
                <p>
                  Highest growth user:{' '}
                  <strong>{data.insights.highestGrowthUser}</strong>
                </p>
                <p>
                  Average confidence:{' '}
                  <strong>
                    {(data.insights.avgConfidenceLevel * 25).toFixed(0)}%
                  </strong>
                </p>
                <p>
                  Users with reliable predictions:{' '}
                  <strong>
                    {data.systemPrediction.highConfidenceUsers} of{' '}
                    {data.insights.totalUsers}
                  </strong>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Recommendations
              </h4>
              <div className="space-y-1 text-sm">
                <p>
                  Recommended purchase:{' '}
                  <strong>
                    {data.systemPrediction.recommendedPurchaseAmount} tokens
                  </strong>
                </p>
                <p>
                  Expected usage:{' '}
                  <strong>
                    {data.systemPrediction.totalPredictedUsage} tokens
                  </strong>
                </p>
                <p>
                  Safety buffer:{' '}
                  <strong>
                    {data.systemPrediction.recommendedPurchaseAmount -
                      data.systemPrediction.totalPredictedUsage}{' '}
                    tokens (15%)
                  </strong>
                </p>
                <p className="pt-2 text-xs text-muted-foreground">
                  {data.systemPrediction.lowConfidenceUsers > 0 &&
                    `Note: ${data.systemPrediction.lowConfidenceUsers} users have low prediction confidence - consider larger buffer.`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
