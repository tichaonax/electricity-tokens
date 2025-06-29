'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Purchase {
  id: string;
  totalTokens: number;
  totalPayment: number;
  purchaseDate: string;
  isEmergency: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
  };
  contributions: {
    id: string;
    user: {
      name: string;
    };
    tokensConsumed: number;
    contributionAmount: number;
  }[];
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

type SortField = 'purchaseDate' | 'totalTokens' | 'totalPayment' | 'creator';
type SortDirection = 'asc' | 'desc';

export function PurchaseHistoryTable({
  userId,
  isAdmin = false,
}: PurchaseHistoryTableProps) {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filtering state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    isEmergency: undefined as boolean | undefined,
    searchTerm: '',
  });

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('purchaseDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, [pagination.page, pagination.limit, filters, sortField, sortDirection]); // fetchPurchases is recreated each render, which is intentional

  const fetchPurchases = async () => {
    try {
      setLoading(true);
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
        sortBy: sortField,
        sortDirection,
      });

      const response = await fetch(`/api/purchases?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }

      const data = await response.json();

      // Filter by search term on client side (for creator name search)
      let filteredPurchases = data.purchases;
      if (filters.searchTerm) {
        filteredPurchases = data.purchases.filter((purchase: Purchase) =>
          purchase.creator.name
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase())
        );
      }

      setPurchases(filteredPurchases);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load purchases'
      );
    } finally {
      setLoading(false);
    }
  };

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

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      isEmergency: undefined,
      searchTerm: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEdit = (purchaseId: string) => {
    router.push(`/dashboard/purchases/${purchaseId}/edit`);
  };

  const handleDelete = async (purchaseId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this purchase? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete purchase');
      }

      // Refresh the list
      fetchPurchases();
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Failed to delete purchase');
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg dark:bg-slate-900 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-600 dark:text-slate-400">
            Loading purchase history...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg dark:bg-slate-900 p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg dark:bg-slate-900">
      {/* Header with filters toggle */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Purchase History
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {pagination.total} total purchases
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={fetchPurchases}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
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

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
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

            {/* Reset Filters */}
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
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
                  Contributors
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
                <td colSpan={7} className="px-6 py-12 text-center">
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
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(purchase.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {purchase.totalTokens.toLocaleString()} kWh
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {purchase.contributions.length} contributor
                      {purchase.contributions.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {purchase.contributions.reduce(
                        (sum, c) => sum + c.tokensConsumed,
                        0
                      )}{' '}
                      kWh used
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {(isAdmin || purchase.creator.id === userId) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(purchase.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(purchase.id)}
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
