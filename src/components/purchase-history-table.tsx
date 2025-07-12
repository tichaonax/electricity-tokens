'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResponsiveTable,
  TouchButton,
  MobileActions,
  ResponsiveBadge,
} from '@/components/ui/responsive-table';
import { SkeletonTable } from '@/components/ui/skeleton';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useToast } from '@/components/ui/toast';
import { useDeleteConfirmation } from '@/components/ui/confirmation-dialog';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Search,
  AlertTriangle,
  Zap,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Plus,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

interface Purchase {
  id: string;
  totalTokens: number;
  totalPayment: number;
  meterReading: number;
  purchaseDate: string;
  isEmergency: boolean;
  createdAt: string;
  canContribute: boolean;
  creator: {
    id: string;
    name: string;
  };
  contribution: {
    id: string;
    user: {
      id: string;
      name: string;
    };
    tokensConsumed: number;
    contributionAmount: number;
    meterReading: number;
  } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PurchaseHistoryTableProps {
  userId?: string;
  isAdmin?: boolean;
}

type SortField =
  | 'purchaseDate'
  | 'totalTokens'
  | 'totalPayment'
  | 'meterReading'
  | 'creator';
type SortDirection = 'asc' | 'desc';

export function PurchaseHistoryTable({
  userId,
  isAdmin = false,
}: PurchaseHistoryTableProps) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const confirmDelete = useDeleteConfirmation();
  const { checkPermission } = usePermissions();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Helper function to get current month date range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
    };
  };

  // Initialize with current month as default
  const defaultDateRange = getCurrentMonthRange();

  // Filtering state - Start with "This Month" as default
  const [filters, setFilters] = useState({
    startDate: defaultDateRange.startDate,
    endDate: defaultDateRange.endDate,
    isEmergency: undefined as boolean | undefined,
    searchTerm: '',
  });

  // Temporary date range state for Apply Filter functionality
  const [tempDateRange, setTempDateRange] = useState({
    startDate: defaultDateRange.startDate,
    endDate: defaultDateRange.endDate,
  });

  // Date validation state
  const [dateError, setDateError] = useState<string>('');

  // Active preset button state
  const [activePreset, setActivePreset] = useState<
    'thisMonth' | 'lastMonth' | 'allTime' | null
  >('thisMonth');

  // Helper function to determine active preset based on current filters
  const getActivePreset = useCallback(() => {
    if (!filters.startDate && !filters.endDate) {
      return 'allTime';
    }

    const currentMonth = getCurrentMonthRange();
    if (
      filters.startDate === currentMonth.startDate &&
      filters.endDate === currentMonth.endDate
    ) {
      return 'thisMonth';
    }

    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split('T')[0];
    if (
      filters.startDate === lastMonthStart &&
      filters.endDate === lastMonthEnd
    ) {
      return 'lastMonth';
    }

    return null; // Custom date range
  }, [filters.startDate, filters.endDate]);

  // Update active preset when filters change
  useEffect(() => {
    setActivePreset(getActivePreset());
  }, [filters.startDate, filters.endDate, getActivePreset]);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('purchaseDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  // Real-time date validation
  useEffect(() => {
    if (tempDateRange.startDate && tempDateRange.endDate) {
      const startDate = new Date(tempDateRange.startDate);
      const endDate = new Date(tempDateRange.endDate);

      if (startDate > endDate) {
        setDateError('Start date cannot be after end date');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  }, [tempDateRange.startDate, tempDateRange.endDate]);

  // Initialize tempDateRange with current filter values
  useEffect(() => {
    setTempDateRange({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  }, [filters.startDate, filters.endDate]);
  const [hasContributablePurchases, setHasContributablePurchases] =
    useState(false);

  const fetchPurchases = useCallback(
    async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setTableLoading(true);
        }
        setError(null);

        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(filters.startDate && {
            startDate: new Date(filters.startDate).toISOString(),
          }),
          ...(filters.endDate && {
            endDate: new Date(filters.endDate).toISOString(),
          }),
          ...(filters.isEmergency !== undefined && {
            isEmergency: filters.isEmergency.toString(),
          }),
          ...(filters.searchTerm && {
            search: filters.searchTerm,
          }),
          sortBy: sortField,
          sortDirection,
        });

        const response = await fetch(`/api/purchases?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch purchases');
        }

        const data = await response.json();

        // Search is now handled server-side
        setPurchases(data.purchases);
        setPagination(data.pagination);

        // Check if there are any purchases that can accept contributions (sequential constraint)
        const hasContributable = data.purchases.some(
          (purchase: Purchase) => purchase.canContribute
        );
        setHasContributablePurchases(hasContributable);
      } catch (error) {
        // console.error removed
        setError(
          error instanceof Error ? error.message : 'Failed to load purchases'
        );
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        } else {
          setTableLoading(false);
        }
      }
    },
    [pagination.page, pagination.limit, filters, sortField, sortDirection]
  );

  // Track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isInitialLoad) {
      fetchPurchases(true);
      setIsInitialLoad(false);
    } else {
      fetchPurchases(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filters,
    sortField,
    sortDirection,
    isInitialLoad,
    fetchPurchases,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const refreshTable = () => {
    fetchPurchases(false); // Non-initial load for manual refresh
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      isEmergency: undefined,
      searchTerm: '',
    });
    setTempDateRange({
      startDate: '',
      endDate: '',
    });
    setDateError('');
    setActivePreset('allTime');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApplyDateFilter = () => {
    // Validate dates before applying
    if (dateError) {
      showError(dateError);
      return;
    }

    setFilters((prev) => ({
      ...prev,
      startDate: tempDateRange.startDate,
      endDate: tempDateRange.endDate,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    // Note: activePreset will be updated by the useEffect when filters change
  };

  // Quick date preset handlers
  const handleThisMonth = () => {
    const range = getCurrentMonthRange();
    setTempDateRange(range);
    setFilters((prev) => ({ ...prev, ...range }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setDateError('');
    setActivePreset('thisMonth');
  };

  const handleLastMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    const range = {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
    };
    setTempDateRange(range);
    setFilters((prev) => ({ ...prev, ...range }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setDateError('');
    setActivePreset('lastMonth');
  };

  const handleAllTime = () => {
    const range = { startDate: '', endDate: '' };
    setTempDateRange(range);
    setFilters((prev) => ({ ...prev, ...range }));
    setPagination((prev) => ({ ...prev, page: 1 }));
    setDateError('');
    setActivePreset('allTime');
  };

  // Anti-flickering date input handlers
  const handleDateChange = (
    field: 'startDate' | 'endDate',
    value: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    setTempDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (purchase: Purchase) => {
    // Check if user has permission to edit purchases
    const canEdit = isAdmin || checkPermission('canEditPurchases');
    if (!canEdit) {
      showError('You do not have permission to edit purchases.');
      return;
    }

    // Check if purchase has a contribution - if so, it cannot be edited (unless admin)
    if (purchase.contribution && !isAdmin) {
      showError(
        'Cannot edit purchase: This purchase already has a matching contribution.'
      );
      return;
    }

    // Show warning for admin override
    if (purchase.contribution && isAdmin) {
      success('Admin override: Editing purchase with existing contribution');
    }

    router.push(`/dashboard/purchases/edit/${purchase.id}`);
  };

  const handleDelete = (purchase: Purchase) => {
    // Check if user has permission to delete purchases
    const canDelete = isAdmin || checkPermission('canDeletePurchases');
    if (!canDelete) {
      showError('You do not have permission to delete purchases.');
      return;
    }

    // Check if purchase has a contribution - if so, it cannot be deleted (unless admin)
    if (purchase.contribution && !isAdmin) {
      showError(
        'Cannot delete purchase: This purchase already has a matching contribution.'
      );
      return;
    }

    // Show warning for admin override
    if (purchase.contribution && isAdmin) {
      success('Admin override: Deleting purchase with existing contribution');
    }

    confirmDelete('purchase', async () => {
      try {
        const response = await fetch(`/api/purchases/${purchase.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete purchase');
        }

        success('Purchase deleted successfully');
        fetchPurchases(false); // Non-initial load
      } catch {
        // console.error removed
        showError('Failed to delete purchase. Please try again.');
      }
    });
  };

  const handleViewContribution = (contributionId: string) => {
    // Navigate to contributions page with specific contribution ID to show details
    router.push(
      `/dashboard/contributions/edit/${contributionId}?from=purchases`
    );
  };

  const handleAddContribution = (purchaseId?: string) => {
    if (purchaseId) {
      // Navigate to specific purchase contribution
      const url = `/dashboard/contributions/new?purchaseId=${purchaseId}`;
      window.location.href = url;
    } else {
      // Find the oldest purchase that can accept contributions (sequential constraint)
      // Sort by purchase date to ensure we get the oldest first
      const sortedPurchases = [...purchases].sort(
        (a, b) =>
          new Date(a.purchaseDate).getTime() -
          new Date(b.purchaseDate).getTime()
      );
      const oldestContributablePurchase = sortedPurchases.find(
        (purchase) => purchase.canContribute
      );

      if (oldestContributablePurchase) {
        const url = `/dashboard/contributions/new?purchaseId=${oldestContributablePurchase.id}`;
        window.location.href = url;
      } else {
        // Fallback to general contribution page
        window.location.href = '/dashboard/contributions/new';
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg dark:bg-slate-900 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Purchase History
          </h2>
        </div>
        <SkeletonTable rows={5} columns={7} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg dark:bg-slate-900 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Purchase History
          </h2>
        </div>
        <ErrorDisplay
          error={error}
          title="Failed to load purchases"
          showRetry
          onRetry={fetchPurchases}
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg dark:bg-slate-900">
      {/* Header with filters toggle */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-1 sm:gap-2 mb-2 sm:mb-4">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
              Purchase History
            </h2>
            <div className="flex gap-2">
              {/* Desktop: Add Contribution button - only show if there are purchases without contributions */}
              {hasContributablePurchases && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleAddContribution()}
                  className="hidden sm:block bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white h-9"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contribution
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push('/dashboard/purchases/new')}
                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700 dark:text-white h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Token
              </Button>
            </div>
          </div>
          <div>
            {/* Desktop: Show full text with badge */}
            <div className="hidden sm:block">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {pagination.total} total purchases
                {hasContributablePurchases && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {purchases.filter((p) => !p.contribution).length} need
                    contribution
                    {purchases.filter((p) => !p.contribution).length !== 1
                      ? 's'
                      : ''}
                  </span>
                )}
              </p>
            </div>
            {/* Mobile: Show text with inline buttons when contributions needed */}
            <div className="sm:hidden">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {pagination.total} total purchases
              </p>
              {hasContributablePurchases && (
                <div className="flex items-center justify-between mt-1 w-full">
                  <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200 flex-1">
                    {purchases.filter((p) => !p.contribution).length} need
                    contribution
                    {purchases.filter((p) => !p.contribution).length !== 1
                      ? 's'
                      : ''}
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAddContribution()}
                    className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white h-9"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contribution
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {/* Desktop: All buttons in a row */}
            <div className="hidden sm:flex gap-2">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={
                  showFilters
                    ? 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700'
                    : ''
                }
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button variant="outline" size="sm" onClick={refreshTable}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Mobile: Only show Filters and Refresh (Add Contribution and Add Token are now inline with message) */}
            <div className="sm:hidden">
              <div className="flex gap-2">
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 ${showFilters ? 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700' : ''}`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshTable}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Filter Display - Always visible when filters are active */}
        {(filters.startDate || filters.endDate) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Active Filters:
                  {filters.startDate && ` From ${filters.startDate}`}
                  {filters.endDate && ` To ${filters.endDate}`}
                  {!filters.startDate && !filters.endDate && ' This Month'}
                </span>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {pagination.total} result{pagination.total !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            {/* Date Filter Error Display */}
            {dateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    {dateError}
                  </span>
                </div>
              </div>
            )}

            {/* Quick Date Preset Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Quick Filters
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={activePreset === 'thisMonth' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleThisMonth}
                  className={
                    activePreset === 'thisMonth'
                      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 dark:bg-green-600 dark:hover:bg-green-700 dark:text-white'
                      : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                  }
                >
                  This Month
                </Button>
                <Button
                  type="button"
                  variant={activePreset === 'lastMonth' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleLastMonth}
                  className={
                    activePreset === 'lastMonth'
                      ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 dark:text-white'
                      : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700'
                  }
                >
                  Last Month
                </Button>
                <Button
                  type="button"
                  variant={activePreset === 'allTime' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleAllTime}
                  className={
                    activePreset === 'allTime'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 dark:text-white'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700'
                  }
                >
                  All Time
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Search Creator
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by creator name..."
                    value={filters.searchTerm}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        searchTerm: e.target.value,
                      }))
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date Range with validation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={tempDateRange.startDate}
                  onChange={(e) =>
                    handleDateChange('startDate', e.target.value, e)
                  }
                  className={
                    dateError ? 'border-red-500 dark:border-red-400' : ''
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={tempDateRange.endDate}
                  onChange={(e) =>
                    handleDateChange('endDate', e.target.value, e)
                  }
                  className={
                    dateError ? 'border-red-500 dark:border-red-400' : ''
                  }
                />
              </div>

              {/* Emergency Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Purchase Type
                </label>
                <select
                  value={
                    filters.isEmergency === undefined
                      ? ''
                      : filters.isEmergency.toString()
                  }
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      isEmergency:
                        e.target.value === ''
                          ? undefined
                          : e.target.value === 'true',
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  <option value="">All Purchases</option>
                  <option value="false">Regular</option>
                  <option value="true">Emergency</option>
                </select>
              </div>

              {/* Apply Filter and Reset Buttons */}
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleApplyDateFilter}
                  disabled={
                    !!dateError ||
                    (tempDateRange.startDate === filters.startDate &&
                      tempDateRange.endDate === filters.endDate)
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Apply Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info message when all purchases have contributions */}
        {!hasContributablePurchases && pagination.total > 0 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
              <p className="text-sm text-green-700 dark:text-green-300">
                All purchases have matching contributions. No new contributions
                can be added at this time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Table */}
      <div className="relative">
        {tableLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-10 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Loading...
              </span>
            </div>
          </div>
        )}
        <ResponsiveTable
          columns={[
            {
              key: 'purchaseDate',
              label: 'Date',
              render: (value, row) => (
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {new Date(value).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(row.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ),
            },
            {
              key: 'totalTokens',
              label: 'Tokens',
              render: (value) => (
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {value.toLocaleString()} kWh
                </span>
              ),
            },
            {
              key: 'totalPayment',
              label: 'Amount',
              render: (value) => (
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  ${value.toFixed(2)}
                </span>
              ),
            },
            {
              key: 'meterReading',
              label: 'Meter Reading',
              mobileHide: true,
              render: (value) => (
                <div>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {value.toLocaleString()} kWh
                  </span>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    at purchase
                  </div>
                </div>
              ),
            },
            {
              key: 'isEmergency',
              label: 'Type',
              render: (value) => (
                <ResponsiveBadge
                  variant={value ? 'destructive' : 'secondary'}
                  className="inline-flex items-center gap-1"
                >
                  {value && <AlertTriangle className="h-3 w-3" />}
                  {value ? 'Emergency' : 'Regular'}
                </ResponsiveBadge>
              ),
            },
            {
              key: 'creator',
              label: 'Creator',
              mobileHide: true,
              render: (value) => (
                <span className="text-sm text-slate-900 dark:text-slate-100">
                  {value?.name || 'Unknown'}
                </span>
              ),
            },
            {
              key: 'contribution',
              label: 'Contribution Status',
              mobileLabel: 'Status',
              render: (value, row) => {
                const contribution = row.contribution;

                if (contribution) {
                  // Has contribution - show status and link to view
                  return (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            Has Contribution
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {contribution.tokensConsumed.toFixed(2)} kWh by{' '}
                        {contribution.user.name} • Meter:{' '}
                        {row.meterReading.toLocaleString()} kWh
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewContribution(contribution.id);
                        }}
                        className="w-fit text-xs h-7 mt-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Contribution
                      </Button>
                    </div>
                  );
                } else {
                  // No contribution - show "add contribution" button
                  return (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          No Contribution
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        {row.totalTokens.toLocaleString()} kWh available •
                        Meter: {row.meterReading.toLocaleString()} kWh
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!row.canContribute || !!row.contribution}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddContribution(row.id);
                        }}
                        className={`w-fit text-xs h-7 mt-1 ${
                          row.canContribute && !row.contribution
                            ? 'text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-950'
                            : 'text-slate-400 border-slate-300 cursor-not-allowed dark:text-slate-500 dark:border-slate-600'
                        }`}
                        title={
                          row.contribution
                            ? 'Purchase already has a contribution'
                            : row.canContribute
                              ? 'Add contribution for this purchase'
                              : 'You must contribute to older purchases first'
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Contribution
                      </Button>
                    </div>
                  );
                }
              },
            },
            {
              key: 'actions',
              label: 'Actions',
              mobileHide: true,
              className: 'w-24 min-w-24',
              render: (value, row) => {
                // Show actions based on permissions instead of ownership
                const canEdit = isAdmin || checkPermission('canEditPurchases');
                const canDelete =
                  isAdmin || checkPermission('canDeletePurchases');

                if (!canEdit && !canDelete) {
                  return null;
                }

                return (
                  <div className="flex items-center gap-1 min-w-fit">
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(row);
                        }}
                        disabled={
                          !!row.contribution &&
                          !isAdmin &&
                          !checkPermission('canEditPurchases')
                        }
                        title={
                          row.contribution &&
                          !isAdmin &&
                          !checkPermission('canEditPurchases')
                            ? 'Cannot edit: Purchase has a contribution'
                            : isAdmin && row.contribution
                              ? 'Edit purchase (Admin override)'
                              : checkPermission('canEditPurchases') &&
                                  row.contribution
                                ? 'Edit purchase (with permission)'
                                : 'Edit purchase'
                        }
                        className="p-2 min-w-8 h-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(row);
                        }}
                        disabled={
                          !!row.contribution &&
                          !isAdmin &&
                          !checkPermission('canDeletePurchases')
                        }
                        title={
                          row.contribution &&
                          !isAdmin &&
                          !checkPermission('canDeletePurchases')
                            ? 'Cannot delete: Purchase has a contribution'
                            : isAdmin && row.contribution
                              ? 'Cannot delete: Has contribution (delete contribution first)'
                              : checkPermission('canDeletePurchases') &&
                                  row.contribution
                                ? 'Delete purchase (with permission)'
                                : 'Delete purchase'
                        }
                        className="text-red-600 hover:text-red-700 p-2 min-w-8 h-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              },
            },
          ]}
          data={purchases.map((purchase) => ({
            ...purchase,
            actions: purchase.id, // Helper for actions column
            // Add mobile actions
            mobileActions: (
              <MobileActions>
                {purchase.contribution ? (
                  <TouchButton
                    onClick={() =>
                      handleViewContribution(purchase.contribution!.id)
                    }
                    variant="secondary"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Contribution
                  </TouchButton>
                ) : (
                  <TouchButton
                    onClick={() => handleAddContribution(purchase.id)}
                    variant="primary"
                    size="sm"
                    disabled={
                      !purchase.canContribute || !!purchase.contribution
                    }
                    title={
                      purchase.contribution
                        ? 'Purchase already has a contribution'
                        : purchase.canContribute
                          ? 'Add contribution for this purchase'
                          : 'You must contribute to older purchases first'
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Contribution
                  </TouchButton>
                )}
                {/* Show edit/delete based on permissions */}
                {(checkPermission('canEditPurchases') ||
                  checkPermission('canDeletePurchases')) && (
                  <>
                    {checkPermission('canEditPurchases') && (
                      <TouchButton
                        onClick={() => handleEdit(purchase)}
                        variant="secondary"
                        size="sm"
                        disabled={
                          !!purchase.contribution &&
                          !isAdmin &&
                          !checkPermission('canEditPurchases')
                        }
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit{' '}
                        {purchase.contribution &&
                        !isAdmin &&
                        !checkPermission('canEditPurchases')
                          ? '(Locked)'
                          : isAdmin && purchase.contribution
                            ? '(Admin)'
                            : checkPermission('canEditPurchases') &&
                                purchase.contribution
                              ? '(Permitted)'
                              : ''}
                      </TouchButton>
                    )}
                    {checkPermission('canDeletePurchases') && (
                      <TouchButton
                        onClick={() => handleDelete(purchase)}
                        variant="danger"
                        size="sm"
                        disabled={
                          !!purchase.contribution &&
                          !isAdmin &&
                          !checkPermission('canDeletePurchases')
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete{' '}
                        {purchase.contribution &&
                        !isAdmin &&
                        !checkPermission('canDeletePurchases')
                          ? '(Locked)'
                          : isAdmin && purchase.contribution
                            ? '(Admin)'
                            : checkPermission('canDeletePurchases') &&
                                purchase.contribution
                              ? '(Permitted)'
                              : ''}
                      </TouchButton>
                    )}
                  </>
                )}
              </MobileActions>
            ),
          }))}
          loading={false} // Never show built-in loading since we have overlay
          emptyMessage={
            showFilters
              ? 'No purchases found. Try adjusting your filters.'
              : 'No purchases found. Get started by creating your first purchase.'
          }
          onRowClick={undefined}
          className="mt-4"
        />
      </div>

      {/* Keep the table for reference but hide it */}
      <div className="hidden overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('purchaseDate')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Date
                  {getSortIcon('purchaseDate')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('totalTokens')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Tokens
                  {getSortIcon('totalTokens')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('totalPayment')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Amount
                  {getSortIcon('totalPayment')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('meterReading')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Meter Reading
                  {getSortIcon('meterReading')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Type
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('creator')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Creator
                  {getSortIcon('creator')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contribution Status
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="h-12 w-12 text-slate-400" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                      No purchases found
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {showFilters
                        ? 'Try adjusting your filters'
                        : 'Get started by creating your first purchase'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {new Date(
                          purchase.purchaseDate + 'T00:00:00'
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(purchase.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {purchase.totalTokens.toLocaleString()} kWh
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">
                      ${purchase.totalPayment.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      $
                      {(purchase.totalPayment / purchase.totalTokens).toFixed(
                        4
                      )}
                      /kWh
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      {purchase.meterReading.toLocaleString()} kWh
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      at purchase
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        purchase.isEmergency
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}
                    >
                      {purchase.isEmergency ? (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Emergency
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-1" />
                          Regular
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {purchase.creator.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {purchase.contribution ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            Has Contribution
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {purchase.contribution.tokensConsumed.toFixed(2)} kWh
                          by {purchase.contribution.user.name} • Meter:{' '}
                          {purchase.meterReading.toLocaleString()} kWh
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewContribution(purchase.contribution!.id);
                          }}
                          className="w-fit text-xs h-7"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Contribution
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            No Contribution
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {purchase.totalTokens.toLocaleString()} kWh available
                          • Meter: {purchase.meterReading.toLocaleString()} kWh
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            !purchase.canContribute || !!purchase.contribution
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddContribution(purchase.id);
                          }}
                          className={`w-fit text-xs h-7 ${
                            purchase.canContribute && !purchase.contribution
                              ? 'text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-950'
                              : 'text-slate-400 border-slate-300 cursor-not-allowed dark:text-slate-500 dark:border-slate-600'
                          }`}
                          title={
                            purchase.contribution
                              ? 'Purchase already has a contribution'
                              : purchase.canContribute
                                ? 'Add contribution for this purchase'
                                : 'You must contribute to older purchases first'
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Contribution
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {(isAdmin || purchase.creator.id === userId) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(purchase)}
                            disabled={!!purchase.contribution && !isAdmin}
                            title={
                              purchase.contribution && !isAdmin
                                ? 'Cannot edit: Purchase has a contribution'
                                : isAdmin && purchase.contribution
                                  ? 'Edit purchase (Admin override)'
                                  : 'Edit purchase'
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(purchase)}
                            disabled={!!purchase.contribution && !isAdmin}
                            title={
                              purchase.contribution && !isAdmin
                                ? 'Cannot delete: Purchase has a contribution'
                                : isAdmin && purchase.contribution
                                  ? 'Delete purchase (Admin override)'
                                  : 'Delete purchase'
                            }
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                of {pagination.total} results
              </span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-3 py-1 border border-slate-300 rounded-md text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1 text-sm text-slate-700 dark:text-slate-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
