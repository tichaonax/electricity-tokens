'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  ArrowRight,
  Zap,
  BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDateTime } from '@/lib/utils';

interface ContributionProgressData {
  totalPurchases: number;
  purchasesWithContributions: number;
  nextPurchaseToContribute: {
    id: string;
    purchaseDate: Date;
    totalTokens: number;
    isEmergency: boolean;
  } | null;
  progressPercentage: number;
}

interface LatestMeterReading {
  reading: number | null;
  readingDate: string | null;
  userName: string | null;
  message: string;
}

interface ContributionProgressProps {
  showActions?: boolean;
  compact?: boolean;
}

export function ContributionProgress({
  showActions = true,
  compact = false,
}: ContributionProgressProps) {
  const [progress, setProgress] = useState<ContributionProgressData | null>(
    null
  );
  const [latestReading, setLatestReading] = useState<LatestMeterReading | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { checkPermission } = usePermissions();

  useEffect(() => {
    fetchProgress();
    if (checkPermission('canAddMeterReadings')) {
      fetchLatestMeterReading();
    }
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contribution-progress');

      if (!response.ok) {
        throw new Error('Failed to fetch contribution progress');
      }

      const data = await response.json();
      setProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestMeterReading = async () => {
    try {
      const response = await fetch('/api/meter-readings/latest');
      if (response.ok) {
        const data = await response.json();
        setLatestReading(data);
      }
    } catch (err) {
      // Silently fail for latest meter reading - it's not critical
      console.error('Failed to fetch latest meter reading:', err);
    }
  };

  const handleContributeNext = () => {
    if (progress?.nextPurchaseToContribute) {
      router.push(
        `/dashboard/contributions/new?purchaseId=${progress.nextPurchaseToContribute.id}`
      );
    }
  };

  const handleViewHistory = () => {
    router.push('/dashboard/purchases/history');
  };

  const handleMeterReadings = () => {
    router.push('/dashboard/meter-readings');
  };

  if (loading) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
              Loading progress...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="text-center py-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProgress}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) return null;

  const isComplete = progress.progressPercentage === 100;
  const hasNextPurchase = progress.nextPurchaseToContribute !== null;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Usage Tracking & Contributions
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {progress.purchasesWithContributions}/{progress.totalPurchases}
            </span>
          </div>
          <Progress value={progress.progressPercentage} className="h-2" />
        </div>
        {hasNextPurchase && showActions && (
          <Button
            size="sm"
            onClick={handleContributeNext}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Usage Tracking & Contributions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Overall Progress
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {progress.purchasesWithContributions} of{' '}
                {progress.totalPurchases} purchases
              </span>
              <Badge
                variant={isComplete ? 'default' : 'secondary'}
                className="bg-white text-slate-900 dark:bg-white dark:text-slate-900"
              >
                {progress.progressPercentage}%
              </Badge>
            </div>
          </div>
          <Progress value={progress.progressPercentage} className="h-3" />
        </div>

        {/* Status */}
        {isComplete ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                All Contributions Complete!
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Every token purchase has a matching contribution.
              </p>
            </div>
          </div>
        ) : hasNextPurchase ? (
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Next Contribution Needed
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {new Date(
                    progress.nextPurchaseToContribute.purchaseDate
                  ).toLocaleDateString()}
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  •
                </span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {progress.nextPurchaseToContribute.totalTokens.toLocaleString()}{' '}
                  kWh
                </span>
                {progress.nextPurchaseToContribute.isEmergency && (
                  <>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      •
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Emergency
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                No Pending Contributions
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                All existing purchases have contributions.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="space-y-2 pt-2">
            {/* Top Row - View History and Meter Readings (Mobile Only) */}
            <div className="flex gap-2 sm:hidden">
              {checkPermission('canViewPurchaseHistory') && (
                <Button
                  variant="outline"
                  onClick={handleViewHistory}
                  className="flex-1"
                >
                  View History
                </Button>
              )}
              {checkPermission('canAddMeterReadings') && (
                <Button
                  variant="outline"
                  onClick={handleMeterReadings}
                  className="flex-1"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Meter Readings
                </Button>
              )}
            </div>

            {/* Bottom Row - Contribute Next (mobile below, desktop inline) */}
            {hasNextPurchase && (
              <div className="block sm:hidden">
                <Button
                  onClick={handleContributeNext}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Contribute Next
                </Button>
              </div>
            )}

            {/* Desktop Row - All buttons together */}
            <div className="hidden sm:flex gap-2">
              {checkPermission('canViewPurchaseHistory') && (
                <Button
                  variant="outline"
                  onClick={handleViewHistory}
                  className="flex-1"
                >
                  View History
                </Button>
              )}
              {hasNextPurchase && (
                <Button
                  onClick={handleContributeNext}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Contribute Next
                </Button>
              )}
              {checkPermission('canAddMeterReadings') && (
                <Button
                  variant="outline"
                  onClick={handleMeterReadings}
                  className="flex-1"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Meter Readings
                </Button>
              )}
            </div>

            {/* Latest Reading Panel - Full Width */}
            {checkPermission('canAddMeterReadings') &&
              latestReading &&
              latestReading.reading && (
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 w-full">
                  <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">
                    Latest Global Reading
                  </div>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {latestReading.reading.toLocaleString()} kWh
                  </div>
                  <div className="text-xs text-blue-500 dark:text-blue-400">
                    by {latestReading.userName} •{' '}
                    {formatDateTime(new Date(latestReading.readingDate!))}
                  </div>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
