'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Loader2, DollarSign, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PaymentBalanceChartProps {
  startDate?: string;
  endDate?: string;
}

interface ContributionDetail {
  purchaseId: string;
  purchaseDate: string;
  contributionAmount: number;
  tokensConsumed: number;
  costPerToken: number;
  trueCost: number;
  balance: number;
  isEmergency: boolean;
}

interface PaymentBalanceData {
  userId: string;
  userName: string;
  userEmail: string;
  totalContributed: number;
  totalTrueCost: number;
  overpayment: number;
  underpayment: number;
  netBalance: number;
  balanceStatus: 'overpaid' | 'underpaid' | 'balanced';
  contributionDetails: ContributionDetail[];
}

export function PaymentBalanceChart({ startDate, endDate }: PaymentBalanceChartProps) {
  const [data, setData] = useState<PaymentBalanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentBalance();
  }, [startDate, endDate]);

  const fetchPaymentBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('type', 'payment-balance');
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());

      const response = await fetch(`/api/reports/financial?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment balance');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      // console.error removed
      setError('Failed to load payment balance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading payment balance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchPaymentBalance} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Balance Data Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          No payment balance data found for the selected time period.
        </p>
      </div>
    );
  }

  // Prepare chart data for balance comparison
  const userNames = data.map(user => user.userName);
  
  const balanceChartData = {
    labels: userNames,
    datasets: [
      {
        label: 'Net Balance ($)',
        data: data.map(user => user.netBalance),
        backgroundColor: data.map(user => {
          if (user.balanceStatus === 'overpaid') return 'rgba(34, 197, 94, 0.8)';
          if (user.balanceStatus === 'underpaid') return 'rgba(239, 68, 68, 0.8)';
          return 'rgba(156, 163, 175, 0.8)';
        }),
        borderColor: data.map(user => {
          if (user.balanceStatus === 'overpaid') return 'rgb(34, 197, 94)';
          if (user.balanceStatus === 'underpaid') return 'rgb(239, 68, 68)';
          return 'rgb(156, 163, 175)';
        }),
        borderWidth: 1,
      },
    ],
  };

  const contributionVsCostData = {
    labels: userNames,
    datasets: [
      {
        label: 'Total Contributed ($)',
        data: data.map(user => user.totalContributed),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'True Cost ($)',
        data: data.map(user => user.totalTrueCost),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
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
        text: 'User Payment Balance Analysis',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const user = data[context.dataIndex];
            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)} (${user.balanceStatus})`;
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Amount ($)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const comparisonOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Contributions vs True Cost',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount ($)',
        },
      },
    },
  };

  // Calculate summary statistics
  const totalOverpayment = data.reduce((sum, user) => sum + Math.max(0, user.netBalance), 0);
  const totalUnderpayment = data.reduce((sum, user) => sum + Math.abs(Math.min(0, user.netBalance)), 0);
  const usersOverpaid = data.filter(user => user.balanceStatus === 'overpaid').length;
  const usersUnderpaid = data.filter(user => user.balanceStatus === 'underpaid').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overpaid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'underpaid':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overpaid':
        return 'text-green-600';
      case 'underpaid':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Payment Balance Analysis
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Analyze overpayments, underpayments, and balance reconciliation by user
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            ${totalOverpayment.toFixed(2)}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Total Overpayment</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            ${totalUnderpayment.toFixed(2)}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Total Underpayment</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {usersOverpaid}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Users Overpaid</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {usersUnderpaid}
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300">Users Underpaid</div>
        </div>
      </div>

      {/* Balance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Balance Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <Bar data={balanceChartData} options={chartOptions} />
        </div>

        {/* Contribution vs Cost Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <Bar data={contributionVsCostData} options={comparisonOptions} />
        </div>
      </div>

      {/* Balance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((user) => (
          <div
            key={user.userId}
            className={`p-4 rounded-lg border ${
              user.balanceStatus === 'overpaid'
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                : user.balanceStatus === 'underpaid'
                ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {user.userName}
              </span>
              {getStatusIcon(user.balanceStatus)}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Contributed:</span>
                <span className="font-medium">${user.totalContributed.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">True Cost:</span>
                <span className="font-medium">${user.totalTrueCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-slate-600 dark:text-slate-400">Balance:</span>
                <span className={`font-bold ${getStatusColor(user.balanceStatus)}`}>
                  {user.netBalance >= 0 ? '+' : ''}${user.netBalance.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                Status: {user.balanceStatus}
              </div>
            </div>
            {user.contributionDetails.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => setSelectedUser(selectedUser === user.userId ? null : user.userId)}
              >
                {selectedUser === user.userId ? 'Hide' : 'Show'} Details
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Detailed User Breakdown */}
      {selectedUser && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              {data.find(u => u.userId === selectedUser)?.userName} - Detailed Breakdown
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Contribution
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tokens Used
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    True Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {data
                  .find(u => u.userId === selectedUser)
                  ?.contributionDetails.map((detail, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                        {new Date(detail.purchaseDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        ${detail.contributionAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {detail.tokensConsumed.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        ${detail.trueCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={detail.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {detail.balance >= 0 ? '+' : ''}${detail.balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          detail.isEmergency 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {detail.isEmergency ? 'Emergency' : 'Regular'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Payment Balance Summary
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Contributed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  True Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Net Balance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contributions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {data.map((user) => (
                <tr key={user.userId}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {user.userName}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {user.userEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    ${user.totalContributed.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    ${user.totalTrueCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`font-medium ${getStatusColor(user.balanceStatus)}`}>
                      {user.netBalance >= 0 ? '+' : ''}${user.netBalance.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user.balanceStatus)}
                      <span className={`capitalize font-medium ${getStatusColor(user.balanceStatus)}`}>
                        {user.balanceStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {user.contributionDetails.length} payments
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