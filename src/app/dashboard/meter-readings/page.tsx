'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/usePermissions';

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

export default function MeterReadingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { checkPermission } = usePermissions();
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
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
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
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
    },
    [pagination.limit]
  );

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMeterReadings();
    }
  }, [status, fetchMeterReadings]);

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
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </button>
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  Meter Readings
                </h1>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-slate-700 dark:text-slate-300">
                {session.user?.name}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ({session.user?.role})
              </span>
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
          <div className="bg-white rounded-lg shadow dark:bg-slate-800">
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
                                <Gauge className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
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
                                <Gauge className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
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
