'use client';

import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDisplayDate } from '@/lib/utils';

interface DailyConsumptionData {
  maxDailyConsumption: {
    amount: number;
    date: string;
    dayOfWeek: string;
  };
  averageDailyConsumption: number;
  last7DaysAverage: number;
  last30DaysAverage: number;
  todayConsumption: number;
  yesterdayConsumption: number | string;
  isNewRecord: boolean;
  percentageAboveAverage: number;
  consumptionPattern: {
    weekdays: number;
    weekends: number;
  };
  recommendation: string;
}

export function MaxDailyConsumptionWidget() {
  const [data, setData] = useState<DailyConsumptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const { checkPermission } = usePermissions();

  // Check if user has permission to view maximum daily consumption
  if (!checkPermission('canViewMaximumDailyConsumption')) {
    return null; // Don't render the widget if user doesn't have permission
  }

  useEffect(() => {
    fetchMaxConsumptionData();
  }, []);

  const fetchMaxConsumptionData = async () => {
    try {
      setLoading(true);
      // Add cache-busting parameters to ensure fresh data
      const cacheBuster = new URLSearchParams({
        t: Date.now().toString(),
        v: 'fresh'
      });
      const response = await fetch(`/api/dashboard/max-daily-consumption?${cacheBuster}`, {
        // Force fresh fetch, bypassing cache
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch max consumption data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Maximum Daily Consumption
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No consumption data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Track daily usage by adding contributions to see your consumption patterns
          </p>
        </div>
      </div>
    );
  }

  const getRecommendationIcon = () => {
    if (data.percentageAboveAverage > 50) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else if (data.isNewRecord) {
      return <Award className="h-4 w-4 text-yellow-500" />;
    } else {
      return <TrendingUp className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRecommendationColor = () => {
    if (data.percentageAboveAverage > 50) {
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    } else if (data.isNewRecord) {
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    } else {
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Maximum Daily Consumption
        </h3>
        {data.isNewRecord && (
          <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
            <Award className="h-4 w-4" />
            <span className="text-xs font-medium">New Record!</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Maximum Daily Record */}
        <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {data.maxDailyConsumption.amount.toLocaleString()} kWh
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDisplayDate(data.maxDailyConsumption.date)}
              ({data.maxDailyConsumption.dayOfWeek})
            </span>
          </div>
          {data.percentageAboveAverage > 0 && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {data.percentageAboveAverage.toFixed(1)}% above average
            </div>
          )}
        </div>

        {/* Comparison Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {data.todayConsumption.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Today's Usage
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {typeof data.yesterdayConsumption === 'number' 
                ? data.yesterdayConsumption.toLocaleString() 
                : data.yesterdayConsumption}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Yesterday's Usage
            </div>
          </div>
        </div>

        {/* Average Comparisons */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              7-Day Average
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {data.last7DaysAverage.toLocaleString()} kWh
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              30-Day Average
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {data.last30DaysAverage.toLocaleString()} kWh
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Overall Average
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {data.averageDailyConsumption.toLocaleString()} kWh
            </span>
          </div>
        </div>

        {/* Usage Pattern */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Consumption Pattern
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Weekdays</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {data.consumptionPattern.weekdays.toLocaleString()} kWh
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Weekends</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {data.consumptionPattern.weekends.toLocaleString()} kWh
              </span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {data.recommendation && (
          <div className={`p-3 rounded-lg ${getRecommendationColor()}`}>
            <div className="flex items-start space-x-2">
              {getRecommendationIcon()}
              <div className="text-xs leading-relaxed">
                {data.recommendation}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}