'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateTokenPurchaseInput } from '@/lib/validations';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormField,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { AlertCircle, CheckCircle2, DollarSign, Zap } from 'lucide-react';

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
    purchaseDate: string;
    isEmergency: boolean;
  };
}

export function PurchaseForm({
  mode = 'create',
  purchaseId,
  onSubmit,
  onSuccess,
  onCancel,
  isLoading = false,
  initialData,
}: PurchaseFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
      totalTokens: initialData?.totalTokens || 0,
      totalPayment: initialData?.totalPayment || 0,
      purchaseDate: initialData?.purchaseDate
        ? new Date(initialData.purchaseDate)
        : new Date(),
      isEmergency: initialData?.isEmergency || false,
    },
  });

  const watchedValues = watch();
  const costPerToken =
    watchedValues.totalTokens > 0
      ? watchedValues.totalPayment / watchedValues.totalTokens
      : 0;

  const handleFormSubmit = async (data: PurchaseFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      // Convert date to ISO string for API submission
      const submitData = {
        ...data,
        purchaseDate: (data.purchaseDate || new Date()).toISOString(),
      };

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
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else if (onSubmit) {
        // Create new purchase (legacy path for existing usage)
        await onSubmit(submitData);
        setSubmitSuccess(true);

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

      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Tokens */}
          <FormField>
            <FormLabel htmlFor="totalTokens">Total Tokens (kWh) *</FormLabel>
            <Input
              id="totalTokens"
              type="number"
              step="0.01"
              min="0"
              max="100000"
              placeholder="Enter total tokens"
              {...register('totalTokens', { valueAsNumber: true })}
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
            <FormLabel htmlFor="totalPayment">Total Payment ($) *</FormLabel>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
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

          {/* Purchase Date */}
          <FormField>
            <FormLabel>Purchase Date *</FormLabel>
            <DatePicker
              date={
                watchedValues.purchaseDate
                  ? new Date(watchedValues.purchaseDate)
                  : undefined
              }
              onDateChange={(date) =>
                setValue('purchaseDate', date || new Date())
              }
              placeholder="Select purchase date"
              className={errors.purchaseDate ? 'border-red-500' : ''}
            />
            <FormDescription>
              Select the date when the tokens were purchased
            </FormDescription>
            {errors.purchaseDate && (
              <FormMessage>{errors.purchaseDate.message}</FormMessage>
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
                </FormLabel>
                <FormDescription>
                  Mark this as an emergency purchase (typically at higher rates)
                </FormDescription>
              </div>
            </div>
          </FormField>
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
            >
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isLoading}
            >
              Clear Form
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
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
