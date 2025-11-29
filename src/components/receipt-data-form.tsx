'use client';

import { useState, useEffect, useRef } from 'react';
// Helper to fetch the first account number
async function fetchFirstAccountNumber() {
  try {
    const res = await fetch('/api/receipt-data/first-account', {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accountNumber || null;
  } catch {
    return null;
  }
}
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatZWG, formatDisplayDateTime } from '@/lib/utils';

// Receipt data form schema matching the project's validation pattern
const receiptDataFormSchema = z.object({
  tokenNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  kwhPurchased: z.number().positive('kWh must be positive'),
  energyCostZWG: z.number().nonnegative('Energy cost cannot be negative'),
  debtZWG: z.number().nonnegative('Debt cannot be negative'),
  reaZWG: z.number().nonnegative('REA cannot be negative'),
  vatZWG: z.number().nonnegative('VAT cannot be negative'),
  totalAmountZWG: z.number().positive('Total amount must be positive'),
  tenderedZWG: z.number().positive('Tendered amount must be positive'),
  transactionDateTime: z.string().min(1, 'Transaction date/time is required'),
});

type ReceiptDataFormValues = z.infer<typeof receiptDataFormSchema>;

interface ReceiptDataFormProps {
  onChange?: (data: Partial<ReceiptDataFormValues>) => void;
  defaultValues?: Partial<ReceiptDataFormValues>;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  hasReceipt?: boolean;
  totalTokens?: number;
  usdAmount?: number;
}

export function ReceiptDataForm({
  onChange,
  defaultValues,
  collapsible = true,
  defaultExpanded = false,
  hasReceipt = false,
  totalTokens,
  usdAmount,
}: ReceiptDataFormProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const {
    register,
    formState: { errors },
    watch,
    setError,
    clearErrors,
    setValue,
  } = useForm<ReceiptDataFormValues>({
    resolver: zodResolver(receiptDataFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const [checkingToken, setCheckingToken] = useState(false);
  const lastCheckedToken = useRef<string | undefined>(undefined);
  const [globalAccountNumber, setGlobalAccountNumber] = useState<string | null>(
    null
  );
  const [accountNumberLoading, setAccountNumberLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchFirstAccountNumber().then((acc) => {
      if (mounted) {
        setGlobalAccountNumber(acc);
        setAccountNumberLoading(false);
        if (acc) setValue('accountNumber', acc);
      }
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill kwhPurchased when totalTokens changes
  useEffect(() => {
    if (totalTokens !== undefined && totalTokens > 0) {
      setValue('kwhPurchased', totalTokens);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTokens]);

  // Pre-populate transactionDateTime from defaultValues in edit mode
  useEffect(() => {
    if (defaultValues?.transactionDateTime) {
      // Convert to datetime-local format (YYYY-MM-DDTHH:mm) without timezone shift
      const date = new Date(defaultValues.transactionDateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      setValue('transactionDateTime', formattedDateTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues?.transactionDateTime]);

  const watchedValues = watch();

  useEffect(() => {
    if (onChange) {
      onChange(watchedValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedValues)]);

  // Calculate total from components
  const calculatedTotal =
    Number(watchedValues.energyCostZWG || 0) +
    Number(watchedValues.debtZWG || 0) +
    Number(watchedValues.reaZWG || 0) +
    Number(watchedValues.vatZWG || 0);

  const totalMismatch =
    calculatedTotal > 0 &&
    Math.abs(calculatedTotal - Number(watchedValues.totalAmountZWG || 0)) >
      0.01;

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/30">
      <CardHeader
        className={
          collapsible
            ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition-colors'
            : ''
        }
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Official Receipt Data (ZWG)
                {hasReceipt && (
                  <span
                    title="Receipt attached"
                    className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 border border-green-700 ml-1 align-middle"
                  />
                )}
              </CardTitle>
              <CardDescription className="text-xs text-blue-700 dark:text-blue-300">
                ZESA official receipt details
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {collapsible && !isExpanded && usdAmount && usdAmount > 0 && watchedValues.totalAmountZWG && watchedValues.totalAmountZWG > 0 && (
              <div className="text-right text-xs text-gray-600 dark:text-gray-400">
                <div>Rate: {(watchedValues.totalAmountZWG / usdAmount).toFixed(2)} ZWG/USD</div>
                <div>Outstanding: {formatZWG((watchedValues.tenderedZWG || 0) - (watchedValues.totalAmountZWG || 0))}</div>
              </div>
            )}
            {collapsible && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                className="ml-2"
                tabIndex={-1}
                onClick={() => setIsExpanded((v) => !v)}
              >
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {(!collapsible || isExpanded) && (
        <CardContent className="space-y-6">
          {/* Token and Account Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="accountNumber">Account Number</FormLabel>
              <Input
                id="accountNumber"
                placeholder="6447 1068 4258 9659 8834"
                {...register('accountNumber')}
                className={errors.accountNumber ? 'border-red-500' : ''}
                readOnly={!!globalAccountNumber}
                disabled={accountNumberLoading}
              />
              <FormDescription className="text-xs text-purple-600 dark:text-purple-400">
                Account number from receipt (first receipt sets for all, then
                read-only)
                {accountNumberLoading && (
                  <span className="ml-2 text-blue-500">Loading...</span>
                )}
                {globalAccountNumber && (
                  <span className="ml-2 text-green-600">(locked)</span>
                )}
              </FormDescription>
              {errors.accountNumber && (
                <FormMessage>{errors.accountNumber.message}</FormMessage>
              )}
            </FormField>

            <FormField>
              <FormLabel htmlFor="tokenNumber">Token Number</FormLabel>
              <Input
                id="tokenNumber"
                placeholder="37266905928"
                {...register('tokenNumber', {
                  onBlur: async (e) => {
                    const value = e.target.value.trim();
                    if (!value || value === lastCheckedToken.current) return;
                    setCheckingToken(true);
                    lastCheckedToken.current = value;
                    try {
                      const res = await fetch(
                        `/api/receipt-data?tokenNumber=${encodeURIComponent(value)}`,
                        { credentials: 'include' }
                      );
                      const data = await res.json();
                      if (data.exists) {
                        const r = data.receiptData;
                        let msg =
                          'A receipt with this token number already exists.';
                        if (r && r.purchase && r.purchase.user) {
                          msg += `\nEntered by: ${r.purchase.user.name} (${r.purchase.user.email})`;
                        }
                        if (r && r.createdAt) {
                          msg += `\nOn: ${formatDisplayDateTime(r.createdAt)}`;
                        }
                        setError('tokenNumber', {
                          type: 'manual',
                          message: msg,
                        });
                      } else {
                        clearErrors('tokenNumber');
                      }
                    } catch {
                      setError('tokenNumber', {
                        type: 'manual',
                        message: 'Could not verify token number. Try again.',
                      });
                    } finally {
                      setCheckingToken(false);
                    }
                  },
                })}
                className={errors.tokenNumber ? 'border-red-500' : ''}
                autoComplete="off"
              />
              <FormDescription className="text-xs text-teal-600 dark:text-teal-400">
                Meter number (optional, unique per purchase)
                {checkingToken && (
                  <span className="ml-2 text-blue-500">Checking...</span>
                )}
              </FormDescription>
              {errors.tokenNumber && (
                <FormMessage>{errors.tokenNumber.message}</FormMessage>
              )}
            </FormField>
          </div>

          {/* kWh and Transaction DateTime */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="kwhPurchased">kWh Purchased *</FormLabel>
              <Input
                id="kwhPurchased"
                type="number"
                step="0.01"
                placeholder="203.21"
                {...register('kwhPurchased', { valueAsNumber: true })}
                className={errors.kwhPurchased ? 'border-red-500' : ''}
              />
              <FormDescription className="text-xs">
                Total kWh from receipt
              </FormDescription>
              {errors.kwhPurchased && (
                <FormMessage>{errors.kwhPurchased.message}</FormMessage>
              )}
            </FormField>

            <FormField>
              <FormLabel htmlFor="transactionDateTime">
                Transaction Date/Time *
              </FormLabel>
              <Input
                id="transactionDateTime"
                type="datetime-local"
                {...register('transactionDateTime')}
                className={errors.transactionDateTime ? 'border-red-500' : ''}
              />
              <FormDescription className="text-xs">
                Select date and time from the picker
              </FormDescription>
              {errors.transactionDateTime && (
                <FormMessage>{errors.transactionDateTime.message}</FormMessage>
              )}
            </FormField>
          </div>

          {/* Cost Breakdown Section */}
          <div className="space-y-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <span className="inline-block w-1 h-4 bg-blue-600 dark:bg-blue-400 rounded"></span>
              Cost Breakdown (ZWG Currency)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField>
                <FormLabel htmlFor="energyCostZWG">Energy Cost *</FormLabel>
                <Input
                  id="energyCostZWG"
                  type="number"
                  step="0.01"
                  placeholder="1306.60"
                  {...register('energyCostZWG', { valueAsNumber: true })}
                  className={errors.energyCostZWG ? 'border-red-500' : ''}
                />
                {errors.energyCostZWG && (
                  <FormMessage>{errors.energyCostZWG.message}</FormMessage>
                )}
              </FormField>

              <FormField>
                <FormLabel htmlFor="debtZWG">Arrears/Debt</FormLabel>
                <Input
                  id="debtZWG"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('debtZWG', { valueAsNumber: true })}
                  className={errors.debtZWG ? 'border-red-500' : ''}
                />
                {errors.debtZWG && (
                  <FormMessage>{errors.debtZWG.message}</FormMessage>
                )}
              </FormField>

              <FormField>
                <FormLabel htmlFor="reaZWG">REA (Regulatory Levy) *</FormLabel>
                <Input
                  id="reaZWG"
                  type="number"
                  step="0.01"
                  placeholder="78.40"
                  {...register('reaZWG', { valueAsNumber: true })}
                  className={errors.reaZWG ? 'border-red-500' : ''}
                />
                {errors.reaZWG && (
                  <FormMessage>{errors.reaZWG.message}</FormMessage>
                )}
              </FormField>

              <FormField>
                <FormLabel htmlFor="vatZWG">VAT *</FormLabel>
                <Input
                  id="vatZWG"
                  type="number"
                  step="0.01"
                  placeholder="195.99"
                  {...register('vatZWG', { valueAsNumber: true })}
                  className={errors.vatZWG ? 'border-red-500' : ''}
                />
                {errors.vatZWG && (
                  <FormMessage>{errors.vatZWG.message}</FormMessage>
                )}
              </FormField>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-200">
            <FormField>
              <FormLabel htmlFor="totalAmountZWG">Total Amount *</FormLabel>
              <Input
                id="totalAmountZWG"
                type="number"
                step="0.01"
                placeholder="1580.99"
                {...register('totalAmountZWG', { valueAsNumber: true })}
                className={errors.totalAmountZWG ? 'border-red-500' : ''}
              />
              <FormDescription className="text-xs">
                Total from receipt
              </FormDescription>
              {errors.totalAmountZWG && (
                <FormMessage>{errors.totalAmountZWG.message}</FormMessage>
              )}
            </FormField>

            <FormField>
              <FormLabel htmlFor="tenderedZWG">Amount Tendered *</FormLabel>
              <Input
                id="tenderedZWG"
                type="number"
                step="0.01"
                placeholder="1581.00"
                {...register('tenderedZWG', { valueAsNumber: true })}
                className={errors.tenderedZWG ? 'border-red-500' : ''}
              />
              <FormDescription className="text-xs">Amount paid</FormDescription>
              {errors.tenderedZWG && (
                <FormMessage>{errors.tenderedZWG.message}</FormMessage>
              )}
            </FormField>
          </div>

          {/* Validation Messages */}
          {calculatedTotal > 0 && (
            <div
              className={`p-3 rounded-md text-sm ${
                totalMismatch
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                  : 'bg-green-50 text-green-800 border border-green-200'
              }`}
            >
              <p className="font-medium">
                {totalMismatch
                  ? '⚠️ Total Mismatch Detected'
                  : '✓ Total Verified'}
              </p>
              <p className="text-xs mt-1">
                Calculated: {formatZWG(calculatedTotal)} | Entered:{' '}
                {formatZWG(Number(watchedValues.totalAmountZWG || 0))}
              </p>
              {totalMismatch && (
                <p className="text-xs mt-1">
                  Please verify the amounts match your receipt.
                </p>
              )}
            </div>
          )}

          {/* Exchange Rate Display */}
          {usdAmount && usdAmount > 0 && watchedValues.totalAmountZWG && watchedValues.totalAmountZWG > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
              <p className="font-medium">💱 Exchange Rate</p>
              <p className="text-xs mt-1">
                ZWG {watchedValues.totalAmountZWG.toLocaleString()} ÷ USD ${usdAmount.toFixed(2)} ={' '}
                <span className="font-bold text-blue-900 dark:text-blue-100">
                  {(watchedValues.totalAmountZWG / usdAmount).toFixed(2)}
                </span>
              </p>
              <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                1 USD = {(watchedValues.totalAmountZWG / usdAmount).toFixed(2)} ZWG
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
