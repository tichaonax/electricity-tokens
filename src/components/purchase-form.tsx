'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTokenPurchaseInput } from '@/lib/validations';
import { CreateReceiptDataInput } from '@/types/receipt-data';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormField,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { AlertCircle, CheckCircle2, DollarSign, Zap, Info } from 'lucide-react';
import { useFormAnimations } from '@/hooks/useFormAnimations';
import { ReceiptDataForm } from '@/components/receipt-data-form';

// Form-specific schema for react-hook-form
const purchaseFormSchema = z.object({
  totalTokens: z
    .number()
    .positive('Must be a positive number')
    .max(100000, 'Total tokens cannot exceed 100,000'),
  totalPayment: z
    .number()
    .positive('Must be a positive number')
    .max(1000000, 'Total payment cannot exceed 1,000,000'),
  meterReading: z
    .number()
    .positive('Meter reading is required and must be greater than 0')
    .max(1000000, 'Initial meter reading cannot exceed 1,000,000'),
  purchaseDate: z.date(),
  isEmergency: z.boolean(),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface PurchaseFormProps {
  mode?: 'create' | 'edit';
  purchaseId?: string;
  onSubmit?: (data: CreateTokenPurchaseInput) => Promise<void>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: {
    totalTokens: number;
    totalPayment: number;
    meterReading: number;
    purchaseDate: string;
    isEmergency: boolean;
  };
  receiptDataDefault?: Partial<CreateReceiptDataInput>;
}

export function PurchaseForm({
  mode = 'create',
  purchaseId,
  onSubmit,
  onSuccess,
  onCancel,
  isLoading = false,
  initialData,
  receiptDataDefault,
}: PurchaseFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { formRef, animateFormSuccess, animateFormError } = useFormAnimations();
  const [meterReadingValidation, setMeterReadingValidation] = useState<{
    isValidating: boolean;
    isValid: boolean;
    error?: string;
    suggestion?: number;
    minimum?: number;
    context?: string;
    warning?: string;
    expectedMaximum?: number;
  }>({
    isValidating: false,
    isValid: true,
  });

  const [sequentialValidation, setSequentialValidation] = useState<{
    isValidating: boolean;
    isValid: boolean;
    error?: string;
    blockingPurchase?: {
      id: string;
      date: string;
      totalTokens: number;
    };
  }>({
    isValidating: false,
    isValid: true,
  });

  const [contextInfo, setContextInfo] = useState<{
    previousPurchase?: {
      meterReading: number;
      date: string;
      totalTokens: number;
    };
    nextPurchase?: {
      meterReading: number;
      date: string;
      totalTokens: number;
    };
    isLoading: boolean;
  }>({
    isLoading: false,
  });

  const [lastMeterReading, setLastMeterReading] = useState<{
    isLoading: boolean;
    reading?: number;
    date?: string;
    error?: string;
  }>({
    isLoading: false,
  });

  const [meterReadingSuggestion, setMeterReadingSuggestion] = useState<{
    isLoading: boolean;
    reading?: number;
    date?: string;
    source?: 'meter_reading' | 'purchase';
    error?: string;
  }>({
    isLoading: false,
  });

  // Receipt data state
  const [receiptData, setReceiptData] = useState<Partial<{
    tokenNumber?: string;
    accountNumber?: string;
    kwhPurchased: number;
    energyCostZWG: number;
    debtZWG: number;
    reaZWG: number;
    vatZWG: number;
    totalAmountZWG: number;
    tenderedZWG: number;
    transactionDateTime: string;
  }> | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      totalTokens: initialData?.totalTokens || undefined,
      totalPayment: initialData?.totalPayment || undefined,
      meterReading: initialData?.meterReading || undefined,
      purchaseDate: initialData?.purchaseDate
        ? new Date(initialData.purchaseDate + 'T00:00:00')
        : new Date(),
      isEmergency: initialData?.isEmergency || false,
    },
  });

  const watchedValues = watch();
  const costPerToken =
    watchedValues.totalTokens > 0
      ? watchedValues.totalPayment / watchedValues.totalTokens
      : 0;

  // Validate meter reading when date or meter reading changes
  const validateMeterReading = useCallback(
    async (reading: number, date: Date) => {
      if (!reading || !date) return;

      setMeterReadingValidation({ isValidating: true, isValid: true });

      try {
        const response = await fetch('/api/validate-meter-reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meterReading: reading,
            purchaseDate: date.toISOString(),
            type: 'purchase',
            excludePurchaseId: purchaseId, // For edit mode
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setMeterReadingValidation({
            isValidating: false,
            isValid: result.valid,
            error: result.error,
            suggestion: result.suggestion,
            minimum: result.minimum,
            context: result.context,
          });
        } else {
          setMeterReadingValidation({
            isValidating: false,
            isValid: false,
            error: 'Unable to validate meter reading',
          });
        }
      } catch {
        setMeterReadingValidation({
          isValidating: false,
          isValid: false,
          error: 'Validation error occurred',
        });
      }
    },
    [purchaseId]
  );

  // Fetch context information for edit mode
  const fetchContextInfo = useCallback(async () => {
    if (mode !== 'edit' || !purchaseId) return;

    setContextInfo({ isLoading: true });

    try {
      const response = await fetch(`/api/purchases/${purchaseId}/context`);
      if (response.ok) {
        const result = await response.json();
        setContextInfo({
          isLoading: false,
          previousPurchase: result.previousPurchase,
          nextPurchase: result.nextPurchase,
        });
      } else {
        setContextInfo({ isLoading: false });
      }
    } catch {
      setContextInfo({ isLoading: false });
    }
  }, [mode, purchaseId]);

  // Fetch last meter reading for create mode
  const fetchLastMeterReading = useCallback(async () => {
    if (mode !== 'create') return;

    setLastMeterReading({ isLoading: true });

    try {
      const response = await fetch(
        '/api/purchases?limit=1&sortBy=purchaseDate&sortDirection=desc'
      );
      if (response.ok) {
        const result = await response.json();
        if (result.purchases && result.purchases.length > 0) {
          const lastPurchase = result.purchases[0];
          setLastMeterReading({
            isLoading: false,
            reading: lastPurchase.meterReading,
            date: lastPurchase.purchaseDate,
          });
        } else {
          setLastMeterReading({
            isLoading: false,
            error: 'No previous purchases found',
          });
        }
      } else {
        setLastMeterReading({
          isLoading: false,
          error: 'Unable to fetch last meter reading',
        });
      }
    } catch {
      setLastMeterReading({
        isLoading: false,
        error: 'Error fetching last meter reading',
      });
    }
  }, [mode]);

  // Fetch meter reading suggestion (prioritize meter readings over purchases)
  const fetchMeterReadingSuggestion = useCallback(async () => {
    if (mode !== 'create') return;

    setMeterReadingSuggestion({ isLoading: true });

    try {
      // First try to get the latest meter reading
      const meterResponse = await fetch('/api/meter-readings?limit=1');
      if (meterResponse.ok) {
        const meterResult = await meterResponse.json();
        if (meterResult.meterReadings && meterResult.meterReadings.length > 0) {
          const latestMeterReading = meterResult.meterReadings[0];
          setMeterReadingSuggestion({
            isLoading: false,
            reading: latestMeterReading.reading,
            date: latestMeterReading.readingDate,
            source: 'meter_reading',
          });

          // Auto-populate the form with the latest meter reading
          setValue('meterReading', latestMeterReading.reading);
          return;
        }
      }

      // Fallback to last purchase meter reading if no meter readings exist
      const purchaseResponse = await fetch(
        '/api/purchases?limit=1&sortBy=purchaseDate&sortDirection=desc'
      );
      if (purchaseResponse.ok) {
        const purchaseResult = await purchaseResponse.json();
        if (purchaseResult.purchases && purchaseResult.purchases.length > 0) {
          const lastPurchase = purchaseResult.purchases[0];
          setMeterReadingSuggestion({
            isLoading: false,
            reading: lastPurchase.meterReading,
            date: lastPurchase.purchaseDate,
            source: 'purchase',
          });

          // Auto-populate the form with the last purchase meter reading
          setValue('meterReading', lastPurchase.meterReading);
          return;
        }
      }

      // No data found
      setMeterReadingSuggestion({
        isLoading: false,
        error: 'No previous meter readings or purchases found',
      });
    } catch {
      setMeterReadingSuggestion({
        isLoading: false,
        error: 'Error fetching meter reading suggestion',
      });
    }
  }, [mode, setValue]);

  // Validate sequential purchase order constraint
  const validateSequentialOrder = useCallback(
    async (date: Date) => {
      if (!date || mode === 'edit') return; // Skip validation for edits

      setSequentialValidation({ isValidating: true, isValid: true });

      try {
        const response = await fetch('/api/validate-sequential-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchaseDate: date.toISOString(),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setSequentialValidation({
            isValidating: false,
            isValid: result.valid,
            error: result.error,
            blockingPurchase: result.blockingPurchase,
          });
        } else {
          setSequentialValidation({
            isValidating: false,
            isValid: false,
            error: 'Unable to validate purchase order',
          });
        }
      } catch {
        setSequentialValidation({
          isValidating: false,
          isValid: false,
          error: 'Validation error occurred',
        });
      }
    },
    [mode]
  );

  // Watch for changes in meter reading and purchase date
  useEffect(() => {
    if (watchedValues.meterReading && watchedValues.purchaseDate) {
      const debounceTimer = setTimeout(() => {
        validateMeterReading(
          watchedValues.meterReading,
          watchedValues.purchaseDate
        );
      }, 500); // Debounce for 500ms

      return () => clearTimeout(debounceTimer);
    }
  }, [
    watchedValues.meterReading,
    watchedValues.purchaseDate,
    validateMeterReading,
  ]);

  // Additional validation for meter reading vs tokens purchased
  useEffect(() => {
    if (
      watchedValues.meterReading &&
      watchedValues.totalTokens &&
      contextInfo.previousPurchase
    ) {
      // For latest purchase (no nextPurchase), include current purchase tokens in maximum
      const expectedMaximum = contextInfo.nextPurchase
        ? contextInfo.previousPurchase.meterReading +
          contextInfo.previousPurchase.totalTokens
        : contextInfo.previousPurchase.meterReading +
          contextInfo.previousPurchase.totalTokens +
          watchedValues.totalTokens;

      if (watchedValues.meterReading > expectedMaximum) {
        const errorMessage = contextInfo.nextPurchase
          ? `Meter reading (${watchedValues.meterReading.toLocaleString()}) cannot exceed maximum of ${expectedMaximum.toLocaleString()} kWh. Please increase tokens purchased to at least ${(watchedValues.meterReading - contextInfo.previousPurchase.meterReading).toLocaleString()} kWh or reduce the meter reading.`
          : `Meter reading (${watchedValues.meterReading.toLocaleString()}) cannot exceed maximum of ${expectedMaximum.toLocaleString()} kWh (prev reading: ${contextInfo.previousPurchase.meterReading.toLocaleString()} + prev tokens: ${contextInfo.previousPurchase.totalTokens.toLocaleString()} + current tokens: ${watchedValues.totalTokens.toLocaleString()}).`;

        setMeterReadingValidation((prev) => ({
          ...prev,
          isValid: false,
          error: errorMessage,
          expectedMaximum,
        }));
      } else {
        setMeterReadingValidation((prev) => ({
          ...prev,
          isValid: true,
          error: undefined,
          expectedMaximum: undefined,
        }));
      }
    }
  }, [
    watchedValues.meterReading,
    watchedValues.totalTokens,
    contextInfo.previousPurchase,
    contextInfo.nextPurchase,
  ]);

  // Watch for changes in purchase date for sequential validation
  useEffect(() => {
    if (watchedValues.purchaseDate && mode === 'create') {
      const debounceTimer = setTimeout(() => {
        validateSequentialOrder(watchedValues.purchaseDate);
      }, 500); // Debounce for 500ms

      return () => clearTimeout(debounceTimer);
    }
  }, [watchedValues.purchaseDate, mode, validateSequentialOrder]);

  // Fetch context information on mount for edit mode
  useEffect(() => {
    if (mode === 'edit') {
      fetchContextInfo();
    }
  }, [mode, fetchContextInfo]);

  // Set initial values when initialData is available
  useEffect(() => {
    if (initialData && mode === 'edit') {
      if (initialData.purchaseDate) {
        setValue(
          'purchaseDate',
          new Date(initialData.purchaseDate + 'T00:00:00')
        );
      }
    }
  }, [initialData, mode, setValue]);

  // Fetch last meter reading on mount for create mode
  useEffect(() => {
    if (mode === 'create') {
      fetchLastMeterReading();
      fetchMeterReadingSuggestion();
    }
  }, [mode, fetchLastMeterReading, fetchMeterReadingSuggestion]);

  const handleFormSubmit = async (data: PurchaseFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      // Convert date to ISO string for API submission
      const submitData: CreateTokenPurchaseInput & {
        receiptData?: Partial<CreateReceiptDataInput>;
      } = {
        ...data,
        purchaseDate: (data.purchaseDate || new Date()).toISOString(),
      };

      // Add receipt data if provided
      if (receiptData && receiptData.kwhPurchased) {
        submitData.receiptData = receiptData;
      }

      if (mode === 'edit' && purchaseId) {
        // Update existing purchase
        const response = await fetch(`/api/purchases/${purchaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update purchase');
        }

        setSubmitSuccess(true);
        animateFormSuccess();
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else if (onSubmit) {
        // Create new purchase (legacy path for existing usage)
        await onSubmit(submitData);
        setSubmitSuccess(true);
        animateFormSuccess();

        // Reset form after successful submission
        setTimeout(() => {
          reset();
          setSubmitSuccess(false);
        }, 2000);
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : `Failed to ${mode} purchase. Please try again.`
      );
      animateFormError();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          {mode === 'edit' ? 'Edit Token Purchase' : 'Token Purchase Entry'}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          {mode === 'edit'
            ? 'Update the details for this electricity token purchase'
            : 'Enter details for a new electricity token purchase'}
        </p>

        {/* Current Values Summary for Edit Mode */}
        {mode === 'edit' && initialData && (
          <div className="mt-4 p-4 bg-slate-100 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              📋 Current Values (what you&apos;re changing from)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">
                  Current Tokens:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {initialData.totalTokens?.toLocaleString() || 'N/A'} kWh
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">
                  Current Payment:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  ${initialData.totalPayment?.toFixed(2) || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">
                  Current Meter Reading:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {typeof initialData.meterReading !== 'undefined'
                    ? initialData.meterReading.toLocaleString()
                    : 'N/A'}{' '}
                  kWh
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">
                  Current Date:
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {initialData.purchaseDate
                    ? new Date(
                        initialData.purchaseDate + 'T00:00:00'
                      ).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
            {initialData.isEmergency && (
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Currently marked as emergency purchase
              </div>
            )}
          </div>
        )}
      </div>

      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Purchase {mode === 'edit' ? 'updated' : 'created'} successfully!
          </span>
        </div>
      )}

      <Form ref={formRef} onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Tokens */}
          <FormField>
            <FormLabel htmlFor="totalTokens">
              Total Tokens (kWh) *
              {mode === 'edit' && (
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                  {initialData?.totalTokens !== undefined ? (
                    <>
                      (was: {initialData.totalTokens.toLocaleString()} kWh)
                      {watchedValues.totalTokens !==
                        initialData.totalTokens && (
                        <span className="ml-1 text-orange-600 dark:text-orange-400 font-medium">
                          → changing to{' '}
                          {watchedValues.totalTokens?.toLocaleString() || '0'}{' '}
                          kWh
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-red-500">
                      (original value loading...)
                    </span>
                  )}
                </span>
              )}
            </FormLabel>
            <Input
              id="totalTokens"
              type="number"
              step="0.01"
              min="0"
              max="100000"
              placeholder="Enter total tokens"
              {...register('totalTokens', {
                valueAsNumber: true,
                setValueAs: (value) =>
                  Math.round(parseFloat(value) * 100) / 100,
              })}
              className={errors.totalTokens ? 'border-red-500' : ''}
            />
            <FormDescription>
              Enter the total number of tokens purchased (1 token = 1 kWh)
            </FormDescription>
            {errors.totalTokens && (
              <FormMessage>{errors.totalTokens.message}</FormMessage>
            )}
          </FormField>

          {/* Total Payment */}
          <FormField>
            <FormLabel htmlFor="totalPayment">
              Total Payment ($) *
              {mode === 'edit' && (
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                  {initialData?.totalPayment !== undefined ? (
                    <>
                      (was: ${initialData.totalPayment.toFixed(2)})
                      {watchedValues.totalPayment !==
                        initialData.totalPayment && (
                        <span className="ml-1 text-orange-600 dark:text-orange-400 font-medium">
                          → changing to $
                          {watchedValues.totalPayment?.toFixed(2) || '0.00'}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-red-500">
                      (original value loading...)
                    </span>
                  )}
                </span>
              )}
            </FormLabel>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-600 dark:text-slate-300" />
              <Input
                id="totalPayment"
                type="number"
                step="0.01"
                min="0"
                max="1000000"
                placeholder="0.00"
                className={`pl-10 ${errors.totalPayment ? 'border-red-500' : ''}`}
                {...register('totalPayment', { valueAsNumber: true })}
              />
            </div>
            <FormDescription>
              Enter the total amount paid for the tokens
            </FormDescription>
            {errors.totalPayment && (
              <FormMessage>{errors.totalPayment.message}</FormMessage>
            )}
          </FormField>

          {/* Initial Meter Reading */}
          <FormField>
            <FormLabel htmlFor="meterReading">
              Initial Meter Reading (kWh) *
              {/* Debug: Always show in edit mode */}
              {mode === 'edit' && (
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                  {initialData?.meterReading !== undefined ? (
                    <>
                      (was: {initialData.meterReading.toLocaleString()} kWh)
                      {watchedValues.meterReading !==
                        initialData.meterReading && (
                        <span className="ml-1 text-orange-600 dark:text-orange-400 font-medium">
                          → changing to{' '}
                          {watchedValues.meterReading?.toLocaleString() || '0'}{' '}
                          kWh
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-red-500">
                      (original value loading...)
                    </span>
                  )}
                </span>
              )}
            </FormLabel>

            {/* Current Meter Reading Display for Edit Mode */}
            {mode === 'edit' &&
              initialData &&
              typeof initialData.meterReading !== 'undefined' && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                      🔄 Changing meter reading from:{' '}
                      {initialData.meterReading.toLocaleString()} kWh
                    </div>
                  </div>
                </div>
              )}

            {/* Auto-populated Meter Reading Display for Create Mode */}
            {mode === 'create' && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950 dark:border-green-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <div className="font-medium mb-1">
                      Auto-populated Meter Reading:
                    </div>
                    {meterReadingSuggestion.isLoading ? (
                      <div>Loading latest meter reading...</div>
                    ) : meterReadingSuggestion.error ? (
                      <div className="text-amber-600 dark:text-amber-400">
                        {meterReadingSuggestion.error}
                      </div>
                    ) : meterReadingSuggestion.reading ? (
                      <div>
                        <div>
                          Using{' '}
                          {meterReadingSuggestion.source === 'meter_reading'
                            ? 'latest meter reading'
                            : 'last purchase meter reading'}
                          :{' '}
                          <span className="font-medium">
                            {meterReadingSuggestion.reading.toLocaleString()}{' '}
                            kWh
                          </span>
                        </div>
                        <div className="text-xs mt-1">
                          From{' '}
                          {meterReadingSuggestion.source === 'meter_reading'
                            ? 'meter reading'
                            : 'purchase'}{' '}
                          on:{' '}
                          {new Date(
                            meterReadingSuggestion.date!
                          ).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✨{' '}
                          {meterReadingSuggestion.source === 'meter_reading'
                            ? 'Form auto-populated with your latest meter reading'
                            : 'Form auto-populated with last purchase meter reading'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        No previous readings found - you can enter any value
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Last Purchase Context for Create Mode */}
            {mode === 'create' && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <div className="font-medium mb-1">
                      Last Purchase Context:
                    </div>
                    {lastMeterReading.isLoading ? (
                      <div>Loading last purchase information...</div>
                    ) : lastMeterReading.error ? (
                      <div className="text-amber-600 dark:text-amber-400">
                        {lastMeterReading.error}
                      </div>
                    ) : lastMeterReading.reading ? (
                      <div>
                        <div>
                          Last purchase meter reading:{' '}
                          <span className="font-medium">
                            {lastMeterReading.reading.toLocaleString()} kWh
                          </span>
                        </div>
                        <div className="text-xs mt-1">
                          From purchase on:{' '}
                          {new Date(
                            lastMeterReading.date!
                          ).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          💡 Your new meter reading should be greater than{' '}
                          {lastMeterReading.reading.toLocaleString()} kWh
                        </div>
                      </div>
                    ) : (
                      <div>This will be your first purchase</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Context Information for Edit Mode */}
            {mode === 'edit' && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <div className="font-medium mb-1">
                      Chronological Context:
                    </div>
                    {contextInfo.isLoading ? (
                      <div>Loading context information...</div>
                    ) : (
                      <div className="space-y-1">
                        {contextInfo.previousPurchase ? (
                          <div>
                            Previous purchase:{' '}
                            {contextInfo.previousPurchase.meterReading?.toLocaleString()}{' '}
                            kWh (
                            {contextInfo.previousPurchase.date
                              ? new Date(
                                  contextInfo.previousPurchase.date
                                ).toLocaleDateString()
                              : 'Unknown date'}
                            )
                          </div>
                        ) : (
                          <div>No previous purchase found</div>
                        )}
                        {contextInfo.nextPurchase && (
                          <div>
                            Next purchase:{' '}
                            {contextInfo.nextPurchase.meterReading?.toLocaleString()}{' '}
                            kWh (
                            {contextInfo.nextPurchase.date
                              ? new Date(
                                  contextInfo.nextPurchase.date
                                ).toLocaleDateString()
                              : 'Unknown date'}
                            )
                          </div>
                        )}
                        {watchedValues.totalTokens &&
                          contextInfo.previousPurchase && (
                            <div className="mt-2 pt-2 border-t border-blue-300 dark:border-blue-700">
                              <div className="font-medium">
                                Maximum Allowed Reading:
                              </div>
                              <div>
                                {contextInfo.nextPurchase ? (
                                  // Not the latest purchase - use previous reading + previous tokens
                                  <>
                                    {(
                                      contextInfo.previousPurchase
                                        .meterReading +
                                      contextInfo.previousPurchase.totalTokens
                                    ).toLocaleString()}{' '}
                                    kWh
                                    <span className="text-xs ml-1">
                                      (prev reading:{' '}
                                      {contextInfo.previousPurchase.meterReading.toLocaleString()}{' '}
                                      + prev tokens:{' '}
                                      {contextInfo.previousPurchase.totalTokens.toLocaleString()}
                                      )
                                    </span>
                                  </>
                                ) : (
                                  // Latest purchase - include current purchase tokens
                                  <>
                                    {(
                                      contextInfo.previousPurchase
                                        .meterReading +
                                      contextInfo.previousPurchase.totalTokens +
                                      watchedValues.totalTokens
                                    ).toLocaleString()}{' '}
                                    kWh
                                    <span className="text-xs ml-1">
                                      (prev reading:{' '}
                                      {contextInfo.previousPurchase.meterReading.toLocaleString()}{' '}
                                      + prev tokens:{' '}
                                      {contextInfo.previousPurchase.totalTokens.toLocaleString()}{' '}
                                      + token purchase:{' '}
                                      {watchedValues.totalTokens.toLocaleString()}
                                      )
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                📏 Meter reading cannot exceed this value
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <Input
                id="meterReading"
                type="number"
                step="0.01"
                min={
                  mode === 'edit'
                    ? contextInfo.previousPurchase?.meterReading ||
                      meterReadingValidation.minimum ||
                      0
                    : lastMeterReading.reading ||
                      meterReadingValidation.minimum ||
                      0
                }
                max={
                  contextInfo.nextPurchase?.meterReading ||
                  (watchedValues.totalTokens && contextInfo.previousPurchase
                    ? contextInfo.nextPurchase
                      ? contextInfo.previousPurchase.meterReading +
                        contextInfo.previousPurchase.totalTokens
                      : contextInfo.previousPurchase.meterReading +
                        contextInfo.previousPurchase.totalTokens +
                        watchedValues.totalTokens
                    : 1000000)
                }
                placeholder={
                  meterReadingValidation.suggestion
                    ? `Enter reading (suggested: ${meterReadingValidation.suggestion.toLocaleString()})`
                    : mode === 'edit' &&
                        contextInfo.previousPurchase?.meterReading
                      ? `Must be >= ${contextInfo.previousPurchase.meterReading.toLocaleString()} kWh`
                      : mode === 'create' && lastMeterReading.reading
                        ? `Must be > ${lastMeterReading.reading.toLocaleString()} kWh`
                        : 'Enter initial meter reading'
                }
                {...register('meterReading', { valueAsNumber: true })}
                className={`${
                  errors.meterReading
                    ? 'border-red-500'
                    : !meterReadingValidation.isValid &&
                        watchedValues.meterReading
                      ? 'border-red-500'
                      : meterReadingValidation.isValid &&
                          watchedValues.meterReading
                        ? 'border-green-500'
                        : ''
                }`}
              />
              {meterReadingValidation.isValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Validation Context */}
            {meterReadingValidation.context && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {meterReadingValidation.context}
                  </div>
                </div>
              </div>
            )}

            {/* Validation Error */}
            {!meterReadingValidation.isValid &&
              meterReadingValidation.error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      {meterReadingValidation.error}
                      {meterReadingValidation.minimum && (
                        <div className="mt-1 font-medium">
                          Minimum required:{' '}
                          {meterReadingValidation.minimum.toLocaleString()} kWh
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            <FormDescription>
              Enter the meter reading at the time of purchase. This value must
              be greater than or equal to the previous meter reading and cannot
              exceed the previous reading plus tokens purchased.
            </FormDescription>
            {errors.meterReading && (
              <FormMessage>{errors.meterReading.message}</FormMessage>
            )}
          </FormField>

          {/* Purchase Date */}
          <FormField>
            <FormLabel>
              Purchase Date *
              {mode === 'edit' && initialData?.purchaseDate && (
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                  (was:{' '}
                  {new Date(
                    initialData.purchaseDate + 'T00:00:00'
                  ).toLocaleDateString()}
                  )
                  {watchedValues.purchaseDate &&
                    new Date(
                      watchedValues.purchaseDate
                    ).toLocaleDateString() !==
                      new Date(
                        initialData.purchaseDate + 'T00:00:00'
                      ).toLocaleDateString() && (
                      <span className="ml-1 text-orange-600 dark:text-orange-400 font-medium">
                        → changing to{' '}
                        {new Date(
                          watchedValues.purchaseDate
                        ).toLocaleDateString()}
                      </span>
                    )}
                </span>
              )}
            </FormLabel>
            <Input
              type="date"
              {...register('purchaseDate', {
                setValueAs: (value) => (value ? new Date(value) : new Date()),
              })}
              defaultValue={
                initialData?.purchaseDate
                  ? initialData.purchaseDate.split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
              className={
                errors.purchaseDate
                  ? 'border-red-500 dark:bg-slate-800 dark:text-slate-100 dark:border-red-600'
                  : 'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
              }
            />
            <FormDescription>
              Select the date when the tokens were purchased
            </FormDescription>
            {errors.purchaseDate && (
              <FormMessage>{errors.purchaseDate.message}</FormMessage>
            )}

            {/* Sequential Purchase Validation Error */}
            {!sequentialValidation.isValid &&
              sequentialValidation.error &&
              mode === 'create' && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      <div className="font-medium">
                        Purchase Order Constraint Violation
                      </div>
                      <div className="mt-1">{sequentialValidation.error}</div>
                      {sequentialValidation.blockingPurchase && (
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/50 rounded border">
                          <div className="font-medium text-xs text-red-800 dark:text-red-200">
                            Blocking Purchase Details:
                          </div>
                          <div className="text-xs text-red-700 dark:text-red-300">
                            Date:{' '}
                            {new Date(
                              sequentialValidation.blockingPurchase.date
                            ).toLocaleDateString()}
                            <br />
                            Tokens:{' '}
                            {sequentialValidation.blockingPurchase.totalTokens.toLocaleString()}{' '}
                            kWh
                          </div>
                          <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                            → Please add a contribution for this purchase first
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </FormField>

          {/* Emergency Purchase */}
          <FormField>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="isEmergency"
                checked={watchedValues.isEmergency}
                onCheckedChange={(checked) => setValue('isEmergency', checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <FormLabel
                  htmlFor="isEmergency"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Emergency Purchase
                  {mode === 'edit' && initialData && (
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 font-normal">
                      (was: {initialData.isEmergency ? 'Emergency' : 'Regular'})
                      {watchedValues.isEmergency !==
                        initialData.isEmergency && (
                        <span className="ml-1 text-orange-600 dark:text-orange-400 font-medium">
                          → changing to{' '}
                          {watchedValues.isEmergency ? 'Emergency' : 'Regular'}
                        </span>
                      )}
                    </span>
                  )}
                </FormLabel>
                <FormDescription>
                  Mark this as an emergency purchase (typically at higher rates)
                </FormDescription>
              </div>
            </div>
          </FormField>
        </div>

        {/* Receipt Data Form (Optional) */}
        <div className="mt-6">
          <ReceiptDataForm
            onChange={(data) => setReceiptData(data)}
            defaultValues={receiptDataDefault}
            collapsible={true}
            defaultExpanded={false}
            hasReceipt={!!receiptDataDefault}
          />
        </div>

        {/* Cost Calculation Display */}
        {watchedValues.totalTokens > 0 && watchedValues.totalPayment > 0 && (
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-md dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
              Cost Calculation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Cost per Token:
                </span>
                <div className="font-medium text-slate-900 dark:text-slate-50">
                  ${costPerToken.toFixed(4)}
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Total Tokens:
                </span>
                <div className="font-medium text-slate-900 dark:text-slate-50">
                  {watchedValues.totalTokens.toLocaleString()} kWh
                </div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">
                  Total Cost:
                </span>
                <div className="font-medium text-slate-900 dark:text-slate-50">
                  ${watchedValues.totalPayment.toFixed(2)}
                </div>
              </div>
            </div>
            {watchedValues.isEmergency && (
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Emergency purchase - typically at higher rates
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-8">
          {mode === 'edit' && onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isLoading}
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Clear Form
            </Button>
          )}
          <Button
            type="submit"
            variant="default"
            disabled={
              isLoading ||
              !meterReadingValidation.isValid ||
              meterReadingValidation.isValidating ||
              (mode === 'create' &&
                (!sequentialValidation.isValid ||
                  sequentialValidation.isValidating))
            }
            className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </div>
            ) : mode === 'edit' ? (
              'Update Purchase'
            ) : (
              'Create Purchase'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}
