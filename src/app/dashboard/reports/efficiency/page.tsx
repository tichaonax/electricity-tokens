'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, Target, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import TokenLossChart from '@/components/reports/TokenLossChart';
import PurchaseTimingChart from '@/components/reports/PurchaseTimingChart';
import UsagePredictionChart from '@/components/reports/UsagePredictionChart';

type ReportType = 'token-loss' | 'purchase-timing' | 'usage-prediction';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function EfficiencyReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('token-loss');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [dateFilter, setDateFilter] = useState<string>('all-time');

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    const now = new Date();
    
    switch (value) {
      case 'this-month':
        setDateRange({
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: now,
        });
        break;
      case 'last-3-months':
        setDateRange({
          from: new Date(now.getFullYear(), now.getMonth() - 3, 1),
          to: now,
        });
        break;
      case 'last-6-months':
        setDateRange({
          from: new Date(now.getFullYear(), now.getMonth() - 6, 1),
          to: now,
        });
        break;
      case 'this-year':
        setDateRange({
          from: new Date(now.getFullYear(), 0, 1),
          to: now,
        });
        break;
      case 'all-time':
        setDateRange({
          from: undefined,
          to: undefined,
        });
        break;
    }
  };

  const renderChart = () => {
    const commonProps = {
      startDate: dateRange.from,
      endDate: dateRange.to,
    };

    switch (reportType) {
      case 'token-loss':
        return <TokenLossChart {...commonProps} />;
      case 'purchase-timing':
        return <PurchaseTimingChart {...commonProps} />;
      case 'usage-prediction':
        return <UsagePredictionChart {...commonProps} />;
      default:
        return <div>Select a report type</div>;
    }
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'token-loss':
        return 'Analyze potential savings by reducing emergency purchases and understanding cost impacts.';
      case 'purchase-timing':
        return 'Get data-driven recommendations for optimal purchase timing to minimize emergency purchases.';
      case 'usage-prediction':
        return 'Predict future usage patterns based on historical data to improve planning.';
      default:
        return '';
    }
  };

  const getReportIcon = () => {
    switch (reportType) {
      case 'token-loss':
        return <TrendingUp className="h-5 w-5" />;
      case 'purchase-timing':
        return <Target className="h-5 w-5" />;
      case 'usage-prediction':
        return <Brain className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Efficiency Metrics</h1>
        <p className="text-muted-foreground">
          Analyze efficiency, optimize purchase timing, and predict future usage patterns.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>
            Select the type of efficiency analysis and date range for your report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="token-loss">Token Loss Analysis</SelectItem>
                  <SelectItem value="purchase-timing">Purchase Timing</SelectItem>
                  <SelectItem value="usage-prediction">Usage Prediction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === 'custom' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Custom Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Pick a date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {getReportIcon()}
            <div>
              <CardTitle>
                {reportType === 'token-loss' && 'Token Loss Analysis'}
                {reportType === 'purchase-timing' && 'Purchase Timing Recommendations'}
                {reportType === 'usage-prediction' && 'Usage Prediction Analysis'}
              </CardTitle>
              <CardDescription>{getReportDescription()}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>
    </div>
  );
}