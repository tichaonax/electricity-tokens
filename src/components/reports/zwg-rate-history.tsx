'use client';

import { useState, useEffect } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatZWG } from '@/lib/utils';

interface RateHistoryEntry {
  date: string;
  zwgRate: number;
  zwgPerKwh: number;
  usdPerKwh: number;
  tokensKwh: number;
  changePercent: number;
}

interface ZWGRateHistoryProps {
  userId?: string;
  limit?: number;
}

type SortField = 'date' | 'zwgRate' | 'zwgPerKwh' | 'changePercent';
type SortOrder = 'asc' | 'desc';

export function ZWGRateHistory({ userId, limit = 50 }: ZWGRateHistoryProps) {
  const [data, setData] = useState<RateHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchRateHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, limit]);

  const fetchRateHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      params.set('limit', limit.toString());

      const response = await fetch(`/api/receipt-data/rate-history?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch rate history');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortedData = () => {
    return [...data].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case 'date':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'zwgRate':
          aVal = a.zwgRate;
          bVal = b.zwgRate;
          break;
        case 'zwgPerKwh':
          aVal = a.zwgPerKwh;
          bVal = b.zwgPerKwh;
          break;
        case 'changePercent':
          aVal = a.changePercent;
          bVal = b.changePercent;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-slate-400" />;
    }
    return sortOrder === 'asc' ? (
      <TrendingUp className="h-4 w-4 ml-1 text-blue-600" />
    ) : (
      <TrendingDown className="h-4 w-4 ml-1 text-blue-600" />
    );
  };

  const getTrendIcon = (changePercent: number) => {
    if (changePercent > 1) {
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    } else if (changePercent < -1) {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

  const getTrendColor = (changePercent: number) => {
    if (changePercent > 5) return 'text-red-600 dark:text-red-400';
    if (changePercent > 1) return 'text-orange-600 dark:text-orange-400';
    if (changePercent < -5) return 'text-green-600 dark:text-green-400';
    if (changePercent < -1) return 'text-blue-600 dark:text-blue-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-lg border">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading rate history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button onClick={fetchRateHistory} variant="outline" size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Rate History
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          No ZWG rate data available yet.
        </p>
      </div>
    );
  }

  const sortedData = getSortedData();

  // Calculate summary statistics
  const avgZwgRate = data.reduce((sum, d) => sum + d.zwgRate, 0) / data.length;
  const minZwgRate = Math.min(...data.map(d => d.zwgRate));
  const maxZwgRate = Math.max(...data.map(d => d.zwgRate));
  const avgZwgPerKwh = data.reduce((sum, d) => sum + d.zwgPerKwh, 0) / data.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          ZWG Exchange Rate History
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Track historical ZWG exchange rates and cost per kWh
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Avg Exchange Rate</div>
          <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
            {formatZWG(avgZwgRate)}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">ZWG per USD</div>
        </div>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <div className="text-sm text-green-700 dark:text-green-300 mb-1">Min Rate</div>
          <div className="text-xl font-bold text-green-900 dark:text-green-100">
            {formatZWG(minZwgRate)}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">Best rate</div>
        </div>

        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
          <div className="text-sm text-red-700 dark:text-red-300 mb-1">Max Rate</div>
          <div className="text-xl font-bold text-red-900 dark:text-red-100">
            {formatZWG(maxZwgRate)}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">Worst rate</div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Avg Cost/kWh</div>
          <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
            {formatZWG(avgZwgPerKwh)}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">ZWG per kWh</div>
        </div>
      </div>

      {/* Rate History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Date
                    <SortIcon field="date" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('zwgRate')}
                    className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Exchange Rate
                    <SortIcon field="zwgRate" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('zwgPerKwh')}
                    className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    ZWG/kWh
                    <SortIcon field="zwgPerKwh" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  USD/kWh
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  kWh
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('changePercent')}
                    className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Change
                    <SortIcon field="changePercent" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {sortedData.map((entry, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {formatZWG(entry.zwgRate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">
                    {formatZWG(entry.zwgPerKwh)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    ${entry.usdPerKwh.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {entry.tokensKwh.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className={`flex items-center gap-1 ${getTrendColor(entry.changePercent)}`}>
                      {getTrendIcon(entry.changePercent)}
                      <span className="font-medium">
                        {entry.changePercent > 0 ? '+' : ''}
                        {entry.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-red-600" />
          <span>Rate increased (worse for buyer)</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingDown className="h-3 w-3 text-green-600" />
          <span>Rate decreased (better for buyer)</span>
        </div>
        <div className="flex items-center gap-1">
          <Minus className="h-3 w-3 text-slate-400" />
          <span>Minimal change (±1%)</span>
        </div>
      </div>
    </div>
  );
}
