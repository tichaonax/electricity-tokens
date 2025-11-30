'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface PurchaseData {
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
}

interface PurchaseComparisonChartProps {
  data: {
    purchases: PurchaseData[];
    summary: {
      totalContributions: number;
      totalTrueCost: number;
      totalElectricityCost: number;
      totalDifference: number;
      averageEfficiency: number;
    };
  };
}

export function PurchaseComparisonChart({ data }: PurchaseComparisonChartProps) {
  const chartData = useMemo(() => {
    return data.purchases.map((purchase) => ({
      date: format(new Date(purchase.purchaseDate), 'MMM dd'),
      fullDate: purchase.purchaseDate,
      contribution: purchase.contributionAmount,
      trueCost: purchase.trueCost,
      totalElectricityCost: purchase.totalElectricityCost,
      difference: purchase.difference,
      isEmergency: purchase.isEmergency,
      efficiency: purchase.trueCost > 0 ? (purchase.trueCost / purchase.contributionAmount) * 100 : 0,
    })).reverse(); // Reverse to show chronological order
  }, [data.purchases]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {format(new Date(data.fullDate), 'MMM dd, yyyy')}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Your Contribution: ${data.contribution.toFixed(2)}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            True Cost: ${data.trueCost.toFixed(2)}
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Total Electricity Cost: ${data.totalElectricityCost.toFixed(2)}
          </p>
          <p className={`text-sm ${
            data.difference >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            Difference: ${Math.abs(data.difference).toFixed(2)}
            {data.difference >= 0 ? ' surplus' : ' deficit'}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Efficiency: {data.efficiency.toFixed(1)}%
          </p>
          {data.isEmergency && (
            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              Emergency Purchase
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        No purchase data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis
              dataKey="date"
              className="text-slate-600 dark:text-slate-400"
              fontSize={12}
            />
            <YAxis
              className="text-slate-600 dark:text-slate-400"
              fontSize={12}
              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="contribution"
              name="Your Contribution"
              fill="#3b82f6"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="trueCost"
              name="True Cost"
              fill="#10b981"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="totalElectricityCost"
              name="Total Electricity Cost"
              fill="#ef4444"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
        <p>
          <strong className="text-blue-600 dark:text-blue-400">Blue bars:</strong> Amount you contributed for each purchase
        </p>
        <p>
          <strong className="text-green-600 dark:text-green-400">Green bars:</strong> Actual electricity cost for the tokens you used (your true cost)
        </p>
        <p>
          <strong className="text-red-600 dark:text-red-400">Red bars:</strong> Total electricity purchase price (what the entire purchase cost)
        </p>
        <p className="mt-2 italic">
          The red bar shows the total cost of each electricity purchase, while the green bar shows your proportional share based on usage.
        </p>
      </div>
    </div>
  );
}