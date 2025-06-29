'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateUserContributionInput } from '@/lib/validations';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Zap,
  Users,
  Calculator,
} from 'lucide-react';

// Form-specific schema for react-hook-form
const contributionFormSchema = z
  .object({
    purchaseId: z.string().cuid('Invalid purchase ID'),
    contributionAmount: z
      .number()
      .positive('Must be a positive number')
      .max(1000000, 'Contribution amount cannot exceed 1,000,000'),
    meterReading: z
      .number()
      .min(0, 'Must be non-negative')
      .max(1000000, 'Meter reading cannot exceed 1,000,000'),
    tokensConsumed: z
      .number()
      .min(0, 'Must be non-negative')
      .max(100000, 'Tokens consumed cannot exceed 100,000'),
    userId: z.string().cuid('Invalid user ID').optional(),
  })
  .refine((data) => data.tokensConsumed <= data.meterReading * 1.1, {
    message: 'Tokens consumed should not significantly exceed meter reading',
    path: ['tokensConsumed'],
  });

type ContributionFormData = z.infer<typeof contributionFormSchema>;

interface Purchase {
  id: string;
  totalTokens: number;
  totalPayment: number;
  purchaseDate: string;
  isEmergency: boolean;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  contributions?: Array<{
    id: string;
    contributionAmount: number;
    tokensConsumed: number;
    user: {
      id: string;
      name: string;
    };
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface ContributionFormProps {
  onSubmit: (data: CreateUserContributionInput) => Promise<void>;
  isLoading?: boolean;
  selectedPurchaseId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function ContributionForm({
  onSubmit,
  isLoading = false,
  selectedPurchaseId,
  currentUserId,
  isAdmin = false,
}: ContributionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      purchaseId: selectedPurchaseId || '',
      contributionAmount: 0,
      meterReading: 0,
      tokensConsumed: 0,
      userId: isAdmin ? '' : currentUserId,
    },
  });

  const watchedValues = watch();

  // Fetch purchases on component mount
  useEffect(() => {
    fetchPurchases();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update selected purchase when purchaseId changes
  useEffect(() => {
    if (watchedValues.purchaseId && purchases.length > 0) {
      const purchase = purchases.find((p) => p.id === watchedValues.purchaseId);
      setSelectedPurchase(purchase || null);
    }
  }, [watchedValues.purchaseId, purchases]);

  const fetchPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const response = await fetch('/api/purchases');
      if (!response.ok) throw new Error('Failed to fetch purchases');

      const data = await response.json();
      setPurchases(data.purchases || []);

      // If a specific purchase was preselected, set it
      if (selectedPurchaseId) {
        setValue('purchaseId', selectedPurchaseId);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setSubmitError('Failed to load purchases. Please refresh the page.');
    } finally {
      setLoadingPurchases(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Calculate true cost and efficiency metrics
  const calculateMetrics = () => {
    if (!selectedPurchase || !watchedValues.tokensConsumed) {
      return { trueCost: 0, efficiency: 0, overpayment: 0, costPerToken: 0 };
    }

    const costPerToken =
      selectedPurchase.totalPayment / selectedPurchase.totalTokens;
    const trueCost = watchedValues.tokensConsumed * costPerToken;
    const efficiency =
      watchedValues.contributionAmount > 0
        ? (trueCost / watchedValues.contributionAmount) * 100
        : 0;
    const overpayment = watchedValues.contributionAmount - trueCost;

    return { trueCost, efficiency, overpayment, costPerToken };
  };

  const { trueCost, efficiency, overpayment, costPerToken } =
    calculateMetrics();

  // Calculate remaining tokens for the purchase
  const getRemainingTokens = () => {
    if (!selectedPurchase) return 0;

    const usedTokens =
      selectedPurchase.contributions?.reduce(
        (sum, contrib) => sum + contrib.tokensConsumed,
        0
      ) || 0;

    return selectedPurchase.totalTokens - usedTokens;
  };

  const handleFormSubmit = async (data: ContributionFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      // Prepare submission data
      const submitData: CreateUserContributionInput = {
        purchaseId: data.purchaseId,
        contributionAmount: data.contributionAmount,
        meterReading: data.meterReading,
        tokensConsumed: data.tokensConsumed,
        ...(isAdmin && data.userId && { userId: data.userId }),
      };

      await onSubmit(submitData);
      setSubmitSuccess(true);

      // Reset form after successful submission
      setTimeout(() => {
        reset();
        setSubmitSuccess(false);
        // Refresh purchases to update remaining tokens
        fetchPurchases();
      }, 2000);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to create contribution. Please try again.'
      );
    }
  };

  if (loadingPurchases) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-600 dark:text-slate-400">
            Loading purchases...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg dark:bg-slate-900">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Users className="h-6 w-6 text-green-600" />
          User Contribution Entry
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Record your electricity usage and contribution for a token purchase
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
          <span>Contribution recorded successfully!</span>
        </div>
      )}

      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            {/* Purchase Selection */}
            <FormField>
              <FormLabel htmlFor="purchaseId">
                Select Token Purchase *
              </FormLabel>
              <select
                id="purchaseId"
                {...register('purchaseId')}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
              >
                <option value="">Select a purchase...</option>
                {purchases.map((purchase) => (
                  <option key={purchase.id} value={purchase.id}>
                    {new Date(purchase.purchaseDate).toLocaleDateString()} -{' '}
                    {purchase.totalTokens} tokens (
                    {purchase.isEmergency ? 'Emergency' : 'Regular'})
                  </option>
                ))}
              </select>
              <FormDescription>
                Select the token purchase you want to contribute to
              </FormDescription>
              {errors.purchaseId && (
                <FormMessage>{errors.purchaseId.message}</FormMessage>
              )}
            </FormField>

            {/* User Selection (Admin only) */}
            {isAdmin && (
              <FormField>
                <FormLabel htmlFor="userId">Select User</FormLabel>
                <select
                  id="userId"
                  {...register('userId')}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
                  disabled={loadingUsers}
                >
                  <option value="">Select user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <FormDescription>
                  Select the user this contribution is for (leave empty for
                  yourself)
                </FormDescription>
                {errors.userId && (
                  <FormMessage>{errors.userId.message}</FormMessage>
                )}
              </FormField>
            )}

            {/* Meter Reading */}
            <FormField>
              <FormLabel htmlFor="meterReading">
                Meter Reading (kWh) *
              </FormLabel>
              <Input
                id="meterReading"
                type="number"
                step="0.01"
                min="0"
                max="1000000"
                placeholder="Enter meter reading"
                {...register('meterReading', { valueAsNumber: true })}
                className={errors.meterReading ? 'border-red-500' : ''}
              />
              <FormDescription>
                Enter your current meter reading in kWh
              </FormDescription>
              {errors.meterReading && (
                <FormMessage>{errors.meterReading.message}</FormMessage>
              )}
            </FormField>

            {/* Tokens Consumed */}
            <FormField>
              <FormLabel htmlFor="tokensConsumed">
                Tokens Consumed (kWh) *
              </FormLabel>
              <Input
                id="tokensConsumed"
                type="number"
                step="0.01"
                min="0"
                max="100000"
                placeholder="Enter tokens consumed"
                {...register('tokensConsumed', { valueAsNumber: true })}
                className={errors.tokensConsumed ? 'border-red-500' : ''}
              />
              <FormDescription>
                Enter the number of tokens you consumed (1 token = 1 kWh)
              </FormDescription>
              {errors.tokensConsumed && (
                <FormMessage>{errors.tokensConsumed.message}</FormMessage>
              )}
            </FormField>

            {/* Contribution Amount */}
            <FormField>
              <FormLabel htmlFor="contributionAmount">
                Your Contribution ($) *
              </FormLabel>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="contributionAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000000"
                  placeholder="0.00"
                  className={`pl-10 ${errors.contributionAmount ? 'border-red-500' : ''}`}
                  {...register('contributionAmount', { valueAsNumber: true })}
                />
              </div>
              <FormDescription>
                Enter the amount you are contributing for this usage
              </FormDescription>
              {errors.contributionAmount && (
                <FormMessage>{errors.contributionAmount.message}</FormMessage>
              )}
            </FormField>
          </div>

          {/* Right Column - Purchase Info & Calculations */}
          <div className="space-y-6">
            {/* Selected Purchase Info */}
            {selectedPurchase && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md dark:bg-slate-800 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Purchase Details
                </h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Date:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {new Date(
                        selectedPurchase.purchaseDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Total Tokens:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {selectedPurchase.totalTokens.toLocaleString()} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Total Cost:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      ${selectedPurchase.totalPayment.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Cost per Token:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      ${costPerToken.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">
                      Remaining Tokens:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {getRemainingTokens().toLocaleString()} kWh
                    </span>
                  </div>
                  {selectedPurchase.isEmergency && (
                    <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Emergency purchase - higher rate
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cost Calculation Display */}
            {watchedValues.tokensConsumed > 0 && selectedPurchase && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950 dark:border-blue-800">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-50 mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Cost Analysis
                </h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      True Cost:
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-50">
                      ${trueCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      Your Contribution:
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-50">
                      ${watchedValues.contributionAmount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      {overpayment >= 0 ? 'Overpayment:' : 'Underpayment:'}
                    </span>
                    <span
                      className={`font-medium ${overpayment >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    >
                      ${Math.abs(overpayment).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      Efficiency:
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-50">
                      {efficiency.toFixed(1)}%
                    </span>
                  </div>
                </div>
                {efficiency < 90 && watchedValues.contributionAmount > 0 && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Consider adjusting your contribution amount
                  </div>
                )}
              </div>
            )}

            {/* Token Validation Warning */}
            {watchedValues.tokensConsumed > getRemainingTokens() &&
              selectedPurchase && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Tokens consumed exceeds available tokens for this purchase
                    </span>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isLoading}
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading || watchedValues.tokensConsumed > getRemainingTokens()
            }
            className="min-w-[120px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </div>
            ) : (
              'Record Contribution'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}
