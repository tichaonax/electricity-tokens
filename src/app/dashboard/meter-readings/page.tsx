'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Gauge,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/usePermissions';

// Helper function to get current month date range
function getCurrentMonthRange() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

// Helper function to get last month date range
function getLastMonthRange() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

interface MeterReading {
  id: string;
  reading: number;
  readingDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  latestUpdateAudit?: {
    id: string;
    timestamp: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
}

interface NewMeterReading {
  reading: string;
  readingDate: string;
  notes: string;
}

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  statistics?: {
    dailyConsumption: number;
    historicalAverage: number;
    historicalMax: number;
    historicalMin: number;
    threshold: number;
    daysBetween: number;
  };
}

function MeterReadingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkPermission } = usePermissions();

  // Check if coming from admin panel - only rely on URL parameter
  const isFromAdmin = searchParams.get('from') === 'admin';

  // Get default date range for current month (memoized to prevent infinite loops)
  const defaultDateRange = useMemo(() => getCurrentMonthRange(), []);

  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filtering state
  const [filters, setFilters] = useState({
    startDate: defaultDateRange.startDate,
    endDate: defaultDateRange.endDate,
    searchTerm: '',
  });

  const [tempDateRange, setTempDateRange] = useState({
    startDate: defaultDateRange.startDate,
    endDate: defaultDateRange.endDate,
  });

  const [dateError, setDateError] = useState<string>('');
  const [activePreset, setActivePreset] = useState<
    'thisMonth' | 'lastMonth' | 'allTime' | null
  >('thisMonth');
  const [showFilters, setShowFilters] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newReading, setNewReading] = useState<NewMeterReading>({
    reading: '',
    readingDate: '',
    notes: '',
  });
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [isEditingLatestReading, setIsEditingLatestReading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchMeterReadings = useCallback(
    async (
      page = 1,
      useTableLoading = false,
      customFilters?: typeof filters
    ) => {
      try {
        if (useTableLoading) {
          setTableLoading(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        // Use custom filters if provided, otherwise use current filters
        const currentFilters = customFilters || filters;

        // Add filtering parameters
        if (currentFilters.startDate) {
          params.append('startDate', currentFilters.startDate);
        }
        if (currentFilters.endDate) {
          params.append('endDate', currentFilters.endDate);
        }
        if (currentFilters.searchTerm) {
          params.append('search', currentFilters.searchTerm);
        }

        const response = await fetch(`/api/meter-readings?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch meter readings');
        }
        const data = await response.json();
        setMeterReadings(data.meterReadings || []);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error fetching meter readings:', error);
        setError('Failed to load meter readings');
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    if (status === 'authenticated') {
      // Initial load with default This Month filters
      const defaultFilters = {
        startDate: defaultDateRange.startDate,
        endDate: defaultDateRange.endDate,
        searchTerm: '',
      };

      const loadInitialData = async () => {
        try {
          setLoading(true);
          setError(null);

          const params = new URLSearchParams({
            page: '1',
            limit: '20',
            startDate: defaultFilters.startDate,
            endDate: defaultFilters.endDate,
          });

          const response = await fetch(`/api/meter-readings?${params}`);
          if (!response.ok) {
            throw new Error('Failed to fetch meter readings');
          }
          const data = await response.json();
          setMeterReadings(data.meterReadings || []);
          setPagination(data.pagination);
        } catch (error) {
          console.error('Error fetching meter readings:', error);
          setError('Failed to load meter readings');
        } finally {
          setLoading(false);
        }
      };

      loadInitialData();
    }
  }, [status, defaultDateRange.startDate, defaultDateRange.endDate]);

  // Date validation and filtering functions
  const validateDateRange = useCallback(
    (startDate: string, endDate: string) => {
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setDateError('Start date cannot be after end date');
        return false;
      }
      setDateError('');
      return true;
    },
    []
  );

  const handleDateChange = useCallback(
    (field: 'startDate' | 'endDate', value: string, e?: React.FormEvent) => {
      e?.preventDefault();

      const newTempRange = { ...tempDateRange, [field]: value };
      setTempDateRange(newTempRange);

      // Real-time validation
      validateDateRange(newTempRange.startDate, newTempRange.endDate);
    },
    [tempDateRange, validateDateRange]
  );

  const applyFilters = useCallback(() => {
    if (dateError) {
      return;
    }

    const newFilters = {
      ...filters,
      startDate: tempDateRange.startDate,
      endDate: tempDateRange.endDate,
    };

    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchMeterReadings(1, true, newFilters);
  }, [dateError, tempDateRange, fetchMeterReadings, filters]);

  const refreshTable = useCallback(() => {
    fetchMeterReadings(pagination.page, true);
  }, [fetchMeterReadings, pagination.page]);

  const resetFilters = useCallback(() => {
    const defaultRange = getCurrentMonthRange();
    const newFilters = {
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      searchTerm: '',
    };

    setTempDateRange(defaultRange);
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setDateError('');
    setActivePreset('thisMonth');
    fetchMeterReadings(1, true, newFilters);
  }, [fetchMeterReadings]);

  // Quick preset handlers
  const handleThisMonth = useCallback(() => {
    const range = getCurrentMonthRange();
    const newFilters = { ...filters, ...range };
    setTempDateRange(range);
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setDateError('');
    setActivePreset('thisMonth');
    fetchMeterReadings(1, true, newFilters);
  }, [fetchMeterReadings, filters]);

  const handleLastMonth = useCallback(() => {
    const range = getLastMonthRange();
    const newFilters = { ...filters, ...range };
    setTempDateRange(range);
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setDateError('');
    setActivePreset('lastMonth');
    fetchMeterReadings(1, true, newFilters);
  }, [fetchMeterReadings, filters]);

  const handleAllTime = useCallback(() => {
    const range = { startDate: '', endDate: '' };
    const newFilters = { ...filters, ...range };
    setTempDateRange(range);
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setDateError('');
    setActivePreset('allTime');
    fetchMeterReadings(1, true, newFilters);
  }, [fetchMeterReadings, filters]);

  // Note: Active preset is managed directly in button handlers to avoid useEffect triggers

  const validateReading = useCallback(async () => {
    if (!newReading.reading || !newReading.readingDate) {
      setValidationResult(null);
      return;
    }

    try {
      setValidating(true);

      // Special validation for latest reading
      if (isEditingLatestReading && meterReadings.length > 1) {
        const newReadingValue = parseFloat(newReading.reading);
        const previousReading = meterReadings[1]; // Second item is the previous reading

        if (newReadingValue <= previousReading.reading) {
          setValidationResult({
            valid: false,
            errors: [
              `Reading must be greater than the previous reading (${previousReading.reading.toFixed(2)} kWh)`,
            ],
            warnings: [],
          });
          setValidating(false);
          return;
        }

        // For latest reading, if it's greater than previous, it's valid
        setValidationResult({
          valid: true,
          errors: [],
          warnings: [],
          statistics: {
            dailyConsumption: newReadingValue - previousReading.reading,
            historicalAverage: 0,
            historicalMax: 0,
            historicalMin: 0,
            threshold: 0,
            daysBetween: 1,
          },
        });
        setValidating(false);
        return;
      }

      // Standard validation for non-latest readings
      const response = await fetch('/api/validate-meter-reading-historical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reading: parseFloat(newReading.reading),
          readingDate: newReading.readingDate,
          editingId: editingId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result);
      } else {
        setValidationResult(null);
      }
    } catch (error) {
      console.error('Error validating reading:', error);
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  }, [
    newReading.reading,
    newReading.readingDate,
    isEditingLatestReading,
    meterReadings,
    editingId,
  ]);

  // Trigger validation when reading or date changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (newReading.reading && newReading.readingDate) {
        validateReading();
      }
    }, 500); // Debounce validation

    return () => clearTimeout(timeoutId);
  }, [newReading.reading, newReading.readingDate, validateReading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newReading.reading || !newReading.readingDate) {
      setError('Reading and date are required');
      return;
    }

    // Check validation before submitting
    // For new readings: always check validation
    // For editing latest reading: check validation
    // For editing older readings: skip validation (existing constraints apply via API)
    if (
      (!editingId || isEditingLatestReading) &&
      validationResult &&
      !validationResult.valid
    ) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    try {
      setError(null);
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/meter-readings/${editingId}`
        : '/api/meter-readings';

      const requestBody = {
        reading: parseFloat(newReading.reading),
        readingDate: newReading.readingDate,
        notes: newReading.notes || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save meter reading');
      }

      // Reset form and refresh data
      setNewReading({ reading: '', readingDate: '', notes: '' });
      setValidationResult(null);
      setShowAddForm(false);
      setEditingId(null);
      setIsEditingLatestReading(false);
      await fetchMeterReadings(1); // Reset to page 1 after adding/editing
    } catch (error) {
      console.error('Error saving meter reading:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to save meter reading'
      );
    }
  };

  const handleEdit = (reading: MeterReading) => {
    setNewReading({
      reading: reading.reading.toString(),
      readingDate: new Date(reading.readingDate).toISOString().split('T')[0],
      notes: reading.notes || '',
    });
    setEditingId(reading.id);

    // Check if this is the latest reading (first in the sorted array)
    const isLatest =
      meterReadings.length > 0 && meterReadings[0].id === reading.id;
    setIsEditingLatestReading(isLatest);

    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meter reading?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/meter-readings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete meter reading');
      }

      await fetchMeterReadings(pagination.page);
    } catch (error) {
      console.error('Error deleting meter reading:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete meter reading'
      );
    }
  };

  const cancelEdit = () => {
    setNewReading({ reading: '', readingDate: '', notes: '' });
    setValidationResult(null);
    setShowAddForm(false);
    setEditingId(null);
    setIsEditingLatestReading(false);
    setError(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchMeterReadings(newPage);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!checkPermission('canAddMeterReadings')) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Access Denied
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You don&apos;t have permission to access meter readings.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white shadow dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {isFromAdmin ? (
                <button
                  onClick={() => router.push('/dashboard/admin')}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Admin Panel</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  Meter Readings
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-slate-700 dark:text-slate-300">
                  {session.user?.name}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  ({session.user?.role})
                </span>
              </div>
              {isFromAdmin && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Daily Meter Readings
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Track all electricity meter readings for accurate consumption
                monitoring across all users.
              </p>
            </div>
            {!showAddForm && (
              <Button variant="outline" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Reading
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Filtering Controls */}
          <div className="mb-6 bg-white rounded-lg shadow p-4 dark:bg-slate-800">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                {/* Desktop: All buttons in a row with active filters display */}
                <div className="hidden sm:flex gap-2 items-center">
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

                  {/* Active Filters and Validation Errors Display */}
                  <div className="flex items-center gap-3 ml-4">
                    {(filters.startDate ||
                      filters.endDate ||
                      activePreset === 'allTime') && (
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Active Filters:
                          {filters.startDate && ` From ${filters.startDate}`}
                          {filters.endDate && ` To ${filters.endDate}`}
                          {!filters.startDate &&
                            !filters.endDate &&
                            activePreset === 'allTime' &&
                            ' All Time'}
                          {!filters.startDate &&
                            !filters.endDate &&
                            activePreset !== 'allTime' &&
                            ' This Month'}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            activePreset === 'allTime'
                              ? 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800'
                              : 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
                          }`}
                        >
                          {activePreset === 'allTime'
                            ? `${pagination.total} total record${pagination.total !== 1 ? 's' : ''}`
                            : `${pagination.total} result${pagination.total !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}

                    {dateError && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-100 border-2 border-red-300 rounded-md animate-pulse dark:bg-red-900/40 dark:border-red-600">
                        <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-400" />
                        <span className="text-sm font-bold text-red-900 dark:text-red-200">
                          ⚠️ {dateError}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile: Filters, Refresh, and status display */}
                <div className="sm:hidden">
                  <div className="flex gap-2 mb-3">
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

                  {/* Mobile Active Filters and Validation Errors */}
                  <div className="space-y-2">
                    {(filters.startDate ||
                      filters.endDate ||
                      activePreset === 'allTime') && (
                      <div
                        className={`flex items-center gap-2 p-2 border rounded ${
                          activePreset === 'allTime'
                            ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                            : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        }`}
                      >
                        <Filter
                          className={`h-4 w-4 ${
                            activePreset === 'allTime'
                              ? 'text-purple-600 dark:text-purple-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            activePreset === 'allTime'
                              ? 'text-purple-800 dark:text-purple-200'
                              : 'text-blue-800 dark:text-blue-200'
                          }`}
                        >
                          Active Filters:
                          {filters.startDate && ` From ${filters.startDate}`}
                          {filters.endDate && ` To ${filters.endDate}`}
                          {!filters.startDate &&
                            !filters.endDate &&
                            activePreset === 'allTime' &&
                            ' All Time'}
                          {!filters.startDate &&
                            !filters.endDate &&
                            activePreset !== 'allTime' &&
                            ' This Month'}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ml-auto font-medium ${
                            activePreset === 'allTime'
                              ? 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800'
                              : 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
                          }`}
                        >
                          {activePreset === 'allTime'
                            ? `${pagination.total} total record${pagination.total !== 1 ? 's' : ''}`
                            : `${pagination.total} result${pagination.total !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}

                    {dateError && (
                      <div className="flex items-center gap-2 p-3 bg-red-100 border-2 border-red-300 rounded-md animate-pulse dark:bg-red-900/40 dark:border-red-600">
                        <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-400" />
                        <span className="text-sm font-bold text-red-900 dark:text-red-200">
                          ⚠️ {dateError}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {/* Quick Date Preset Buttons */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Quick Filters
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        activePreset === 'thisMonth' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={handleThisMonth}
                      className={`flex-1 text-xs sm:text-sm ${
                        activePreset === 'thisMonth'
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 dark:bg-green-600 dark:hover:bg-green-700 dark:text-white'
                          : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                      }`}
                    >
                      This Month
                    </Button>
                    <Button
                      type="button"
                      variant={
                        activePreset === 'lastMonth' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={handleLastMonth}
                      className={`flex-1 text-xs sm:text-sm ${
                        activePreset === 'lastMonth'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 dark:text-white'
                          : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700'
                      }`}
                    >
                      Last Month
                    </Button>
                    <Button
                      type="button"
                      variant={
                        activePreset === 'allTime' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={handleAllTime}
                      className={`flex-1 text-xs sm:text-sm ${
                        activePreset === 'allTime'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 dark:text-white'
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700'
                      }`}
                    >
                      All Time
                    </Button>
                  </div>
                </div>

                {/* Date Range Inputs and Search */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Search Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Search Notes
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search in notes..."
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
                      className={`${
                        dateError
                          ? 'border-2 border-red-500 bg-red-50 ring-2 ring-red-200 animate-pulse dark:border-red-400 dark:bg-red-900/20 dark:ring-red-800'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
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
                      className={`${
                        dateError
                          ? 'border-2 border-red-500 bg-red-50 ring-2 ring-red-200 animate-pulse dark:border-red-400 dark:bg-red-900/20 dark:ring-red-800'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Apply and Reset Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyFilters}
                    disabled={
                      !!dateError ||
                      (tempDateRange.startDate === filters.startDate &&
                        tempDateRange.endDate === filters.endDate)
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    Apply Filter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="flex-1"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 bg-white rounded-lg shadow p-6 dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {editingId
                  ? isEditingLatestReading
                    ? 'Edit Latest Meter Reading'
                    : 'Edit Meter Reading'
                  : 'Add New Meter Reading'}
              </h3>
              {isEditingLatestReading && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Latest Reading:</strong> You can update this reading
                    as long as it&apos;s greater than the previous reading.
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Meter Reading *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newReading.reading}
                      onChange={(e) =>
                        setNewReading({
                          ...newReading,
                          reading: e.target.value,
                        })
                      }
                      placeholder="Enter meter reading"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Reading Date *
                    </label>
                    <Input
                      type="date"
                      value={newReading.readingDate}
                      onChange={(e) =>
                        setNewReading({
                          ...newReading,
                          readingDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Notes (optional)
                  </label>
                  <Textarea
                    value={newReading.notes}
                    onChange={(e) =>
                      setNewReading({ ...newReading, notes: e.target.value })
                    }
                    placeholder="Any additional notes about this reading..."
                    rows={3}
                  />
                </div>

                {/* Validation Display */}
                {validating && (
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Validating reading...</span>
                  </div>
                )}

                {validationResult && (
                  <div className="space-y-3">
                    {/* Validation Errors */}
                    {validationResult.errors.length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950 dark:border-red-800">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                              Validation Errors
                            </h4>
                            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                              {validationResult.errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Validation Warnings */}
                    {validationResult.warnings.length > 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950 dark:border-yellow-800">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                              Validation Warnings
                            </h4>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                              {validationResult.warnings.map(
                                (warning, index) => (
                                  <li key={index}>• {warning}</li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Consumption Statistics */}
                    {validationResult.statistics && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                              Consumption Analysis
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-400">
                              <div>
                                <span className="font-medium">
                                  Daily consumption:
                                </span>{' '}
                                {validationResult.statistics.dailyConsumption.toFixed(
                                  2
                                )}{' '}
                                kWh
                              </div>
                              <div>
                                <span className="font-medium">Period:</span>{' '}
                                {validationResult.statistics.daysBetween} day
                                {validationResult.statistics.daysBetween !== 1
                                  ? 's'
                                  : ''}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Your average:
                                </span>{' '}
                                {validationResult.statistics.historicalAverage.toFixed(
                                  2
                                )}{' '}
                                kWh/day
                              </div>
                              <div>
                                <span className="font-medium">
                                  Your maximum:
                                </span>{' '}
                                {validationResult.statistics.historicalMax.toFixed(
                                  2
                                )}{' '}
                                kWh/day
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success message */}
                    {validationResult.valid &&
                      validationResult.warnings.length === 0 && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-300">
                              Reading validation successful
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={validationResult && !validationResult.valid}
                  >
                    {editingId ? 'Update Reading' : 'Add Reading'}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Meter Readings List */}
          <div className="relative bg-white rounded-lg shadow dark:bg-slate-800">
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
            {meterReadings.length === 0 ? (
              <div className="p-12 text-center">
                <Gauge className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No meter readings yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Start tracking your electricity usage by adding your first
                  meter reading.
                </p>
                {!showAddForm && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Reading
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Reading
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Consumption
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Created/Modified By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {meterReadings.map((reading, index) => {
                        const previousReading = meterReadings[index + 1];
                        const consumption = previousReading
                          ? reading.reading - previousReading.reading
                          : null;

                        return (
                          <tr key={reading.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                                <span className="text-sm text-slate-900 dark:text-slate-100">
                                  {
                                    new Date(reading.readingDate)
                                      .toISOString()
                                      .split('T')[0]
                                  }
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Gauge className="h-4 w-4 text-purple-600 mr-2" />
                                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                  {reading.reading.toFixed(2)} kWh
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {consumption !== null ? (
                                <div className="flex items-center">
                                  {consumption >= 0 ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                                  )}
                                  <span
                                    className={`text-sm font-medium ${
                                      consumption >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    }`}
                                  >
                                    {consumption >= 0 ? '+' : ''}
                                    {consumption.toFixed(2)} kWh
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {reading.notes || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="text-slate-900 dark:text-slate-100 font-medium">
                                  {reading.user?.name || 'Unknown'}
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 text-xs">
                                  Created:{' '}
                                  {new Date(
                                    reading.createdAt
                                  ).toLocaleDateString()}{' '}
                                  {new Date(
                                    reading.createdAt
                                  ).toLocaleTimeString()}
                                  {reading.latestUpdateAudit ? (
                                    <div className="text-amber-600 dark:text-amber-400">
                                      Updated:{' '}
                                      {new Date(
                                        reading.latestUpdateAudit.timestamp
                                      ).toLocaleDateString()}{' '}
                                      {new Date(
                                        reading.latestUpdateAudit.timestamp
                                      ).toLocaleTimeString()}
                                      <br />
                                      by {reading.latestUpdateAudit.user.name}
                                    </div>
                                  ) : reading.updatedAt &&
                                    reading.updatedAt !== reading.createdAt ? (
                                    <div className="text-amber-600 dark:text-amber-400">
                                      Updated:{' '}
                                      {new Date(
                                        reading.updatedAt
                                      ).toLocaleDateString()}{' '}
                                      {new Date(
                                        reading.updatedAt
                                      ).toLocaleTimeString()}
                                      <br />
                                      (Legacy update - no audit info)
                                    </div>
                                  ) : null}
                                  {session?.user?.role === 'ADMIN' &&
                                    (reading.latestUpdateAudit ||
                                      (reading.updatedAt &&
                                        reading.updatedAt !==
                                          reading.createdAt)) && (
                                      <div className="mt-1">
                                        <a
                                          href={`/dashboard/admin/audit-logs?entityType=MeterReading&entityId=${reading.id}`}
                                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ExternalLink className="h-3 w-3 mr-1" />
                                          View Audit Log
                                        </a>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(reading)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(reading.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden">
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {meterReadings.map((reading, index) => {
                      const previousReading = meterReadings[index + 1];
                      const consumption = previousReading
                        ? reading.reading - previousReading.reading
                        : null;

                      return (
                        <div key={reading.id} className="p-4">
                          {/* Date and Reading */}
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center mb-1">
                                <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {
                                    new Date(reading.readingDate)
                                      .toISOString()
                                      .split('T')[0]
                                  }
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Gauge className="h-4 w-4 text-purple-600 mr-2" />
                                <span className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                                  {reading.reading.toFixed(2)} kWh
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(reading)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(reading.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Consumption */}
                          {consumption !== null && (
                            <div className="flex items-center mb-2">
                              {consumption >= 0 ? (
                                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                              )}
                              <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">
                                Consumption:
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  consumption >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {consumption >= 0 ? '+' : ''}
                                {consumption.toFixed(2)} kWh
                              </span>
                            </div>
                          )}

                          {/* Notes */}
                          {reading.notes && (
                            <div className="mb-2">
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                Notes: {reading.notes}
                              </span>
                            </div>
                          )}

                          {/* Creator/Modifier Info */}
                          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                            <div>
                              <span className="font-medium">Created by:</span>{' '}
                              {reading.user?.name || 'Unknown'}
                            </div>
                            <div>
                              {new Date(reading.createdAt).toLocaleDateString()}{' '}
                              {new Date(reading.createdAt).toLocaleTimeString()}
                            </div>

                            {reading.latestUpdateAudit ? (
                              <div className="text-amber-600 dark:text-amber-400">
                                <div>
                                  <span className="font-medium">
                                    Updated by:
                                  </span>{' '}
                                  {reading.latestUpdateAudit.user.name}
                                </div>
                                <div>
                                  {new Date(
                                    reading.latestUpdateAudit.timestamp
                                  ).toLocaleDateString()}{' '}
                                  {new Date(
                                    reading.latestUpdateAudit.timestamp
                                  ).toLocaleTimeString()}
                                </div>
                              </div>
                            ) : reading.updatedAt &&
                              reading.updatedAt !== reading.createdAt ? (
                              <div className="text-amber-600 dark:text-amber-400">
                                <div>
                                  Updated:{' '}
                                  {new Date(
                                    reading.updatedAt
                                  ).toLocaleDateString()}{' '}
                                  {new Date(
                                    reading.updatedAt
                                  ).toLocaleTimeString()}
                                </div>
                                <div>(Legacy update - no audit info)</div>
                              </div>
                            ) : null}

                            {session?.user?.role === 'ADMIN' &&
                              (reading.latestUpdateAudit ||
                                (reading.updatedAt &&
                                  reading.updatedAt !== reading.createdAt)) && (
                                <div className="mt-2">
                                  <a
                                    href={`/dashboard/admin/audit-logs?entityType=MeterReading&entityId=${reading.id}`}
                                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View Audit Log
                                  </a>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing page {pagination.page} of {pagination.totalPages} (
                {pagination.total} total readings)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className="hidden sm:inline-flex"
                >
                  First
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md text-blue-900 dark:text-blue-100">
                  {pagination.page}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  className="hidden sm:inline-flex"
                >
                  Last
                </Button>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 dark:bg-blue-950 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              Understanding Meter Readings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Recording Guidelines
                </h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>
                    • Record readings at the same time each day for consistency
                  </li>
                  <li>
                    • Ensure readings are in chronological order (newer ≥ older)
                  </li>
                  <li>• Double-check the numbers to avoid data entry errors</li>
                  <li>• Add notes for any unusual circumstances</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Consumption Tracking
                </h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Daily consumption is calculated automatically</li>
                  <li>• Green values indicate normal forward consumption</li>
                  <li>• Red values may indicate meter rollover or errors</li>
                  <li>• Use consumption data to optimize usage patterns</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Disable SSR for this component since it uses client-side hooks
export default dynamic(() => Promise.resolve(MeterReadingsPage), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  ),
});
