'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatZWG } from '@/lib/utils';

interface DualCurrencyDataPoint {
  date: string;
  usdCost: number;
  zwgCost: number;
  zwgRate: number;
  tokensKwh: number;
  usdPerKwh: number;
  zwgPerKwh: number;
}

interface DualCurrencyChartProps {
  userId?: string;
  startDate?: string;
  endDate?: string;
}

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';
type ChartView = 'cost' | 'rate' | 'both';

export function DualCurrencyChart({ userId, startDate, endDate }: DualCurrencyChartProps) {
  const [data, setData] = useState<DualCurrencyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartView, setChartView] = useState<ChartView>('both');

  useEffect(() => {
    fetchDualCurrencyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, startDate, endDate, timeRange]);

  const fetchDualCurrencyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('timeRange', timeRange);

      const response = await fetch(`/api/receipt-data/dual-currency-analysis?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dual currency data');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-lg border">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading chart data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button onClick={fetchDualCurrencyData} variant="outline" size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border">
        <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Data Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          No receipt data found for the selected time period.
        </p>
      </div>
    );
  }

  // Calculate summary statistics
  const avgUsdPerKwh = data.reduce((sum, d) => sum + d.usdPerKwh, 0) / data.length;
  const avgZwgPerKwh = data.reduce((sum, d) => sum + d.zwgPerKwh, 0) / data.length;
  const avgZwgRate = data.reduce((sum, d) => sum + d.zwgRate, 0) / data.length;
  const totalKwh = data.reduce((sum, d) => sum + d.tokensKwh, 0);

  // Calculate trends (first vs last)
  const usdTrend = data.length > 1 ? ((data[data.length - 1].usdPerKwh - data[0].usdPerKwh) / data[0].usdPerKwh) * 100 : 0;
  const zwgTrend = data.length > 1 ? ((data[data.length - 1].zwgPerKwh - data[0].zwgPerKwh) / data[0].zwgPerKwh) * 100 : 0;

  // Format data for display
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    USD: parseFloat(d.usdPerKwh.toFixed(4)),
    ZWG: parseFloat((d.zwgPerKwh / 1000).toFixed(2)), // Convert to thousands for better scale
    usdCost: d.usdCost,
    zwgCost: d.zwgCost,
    zwgRate: d.zwgRate,
    tokens: d.tokensKwh,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">{data.date}</p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              USD: ${data.USD.toFixed(4)}/kWh
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              ZWG: {formatZWG(data.ZWG * 1000)}/kWh
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Rate: {formatZWG(data.zwgRate)}/USD
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tokens: {data.tokens.toLocaleString()} kWh
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Dual Currency Cost Analysis
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Compare USD vs ZWG pricing trends over time
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Time Range Buttons */}
          {(['7d', '30d', '90d', '1y', 'all'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : range === '1y' ? '1 Year' : 'All Time'}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Avg USD Cost</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            ${avgUsdPerKwh.toFixed(4)}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">per kWh</div>
          <div className={`flex items-center gap-1 mt-2 text-sm ${usdTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {usdTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(usdTrend).toFixed(1)}%
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <div className="text-sm text-green-700 dark:text-green-300 mb-1">Avg ZWG Cost</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatZWG(avgZwgPerKwh)}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">per kWh</div>
          <div className={`flex items-center gap-1 mt-2 text-sm ${zwgTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {zwgTrend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(zwgTrend).toFixed(1)}%
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Avg Exchange Rate</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {formatZWG(avgZwgRate)}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">ZWG per USD</div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
          <div className="text-sm text-orange-700 dark:text-orange-300 mb-1">Total Usage</div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {totalKwh.toLocaleString()}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">kWh purchased</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={chartView === 'cost' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartView('cost')}
        >
          Total Cost
        </Button>
        <Button
          variant={chartView === 'rate' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartView('rate')}
        >
          Cost per kWh
        </Button>
        <Button
          variant={chartView === 'both' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartView('both')}
        >
          Both
        </Button>
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border">
        <ResponsiveContainer width="100%" height={400}>
          {chartView === 'both' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#3b82f6"
                style={{ fontSize: '12px' }}
                label={{ value: 'USD/kWh', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                style={{ fontSize: '12px' }}
                label={{ value: 'ZWG/kWh (thousands)', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="USD" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="USD per kWh"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ZWG" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="ZWG per kWh (K)"
              />
            </LineChart>
          ) : chartView === 'cost' ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="usdCost" 
                fill="#3b82f6" 
                fillOpacity={0.6}
                stroke="#3b82f6" 
                strokeWidth={2}
                name="USD Cost"
              />
              <Area 
                type="monotone" 
                dataKey="zwgCost" 
                fill="#10b981" 
                fillOpacity={0.6}
                stroke="#10b981" 
                strokeWidth={2}
                name="ZWG Cost"
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#3b82f6"
                style={{ fontSize: '12px' }}
                label={{ value: 'USD/kWh', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                style={{ fontSize: '12px' }}
                label={{ value: 'ZWG/kWh (thousands)', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="USD" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="USD per kWh"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ZWG" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="ZWG per kWh (K)"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Detailed Cost History
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">kWh</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">USD Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ZWG Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">USD/kWh</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ZWG/kWh</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {item.tokensKwh.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">
                    ${item.usdCost.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">
                    {formatZWG(item.zwgCost)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    ${item.usdPerKwh.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {formatZWG(item.zwgPerKwh)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {formatZWG(item.zwgRate)}
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
