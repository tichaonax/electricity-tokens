'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session } from 'next-auth';
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
  X,
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
  canContribute: boolean;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  contribution?: {
    id: string;
    contributionAmount: number;
    tokensConsumed: number;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface ContributionFormProps {
  onSubmit: (data: CreateUserContributionInput) => Promise<void>;
  isLoading?: boolean;
  selectedPurchaseId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  session?: Session | null;
}

export function ContributionForm({
  onSubmit,
  isLoading = false,
  selectedPurchaseId,
  currentUserId,
  isAdmin = false,
  session,
}: ContributionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [previousMeterReading, setPreviousMeterReading] = useState<number>(0);
  const [loadingPreviousReading, setLoadingPreviousReading] = useState(false);
  const [userHasContributed, setUserHasContributed] = useState(false);
  const [contributedPurchaseIds, setContributedPurchaseIds] = useState<
    Set<string>
  >(new Set());
  const [showContributionWarning, setShowContributionWarning] = useState(true);
  const [meterReadingValidation, setMeterReadingValidation] = useState<{
    isValidating: boolean;
    isValid: boolean;
    error?: string;
    suggestedMinimum?: number;
  }>({
    isValidating: false,
    isValid: true,
  });
  const [historicalSuggestion, setHistoricalSuggestion] = useState<{
    loading: boolean;
    suggestedAmount: number;
    averageUsage: number;
    averageContribution: number;
    totalContributions: number;
    efficiencyScore: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
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
      userId: currentUserId, // Always set to current user (no longer admin selectable)
    },
  });

  const watchedValues = watch();

  // This function is no longer needed since we check contributions directly from purchase data
  // Keeping it for historical analysis functionality

  // Check if purchase already has a contribution (new business rule: one contribution per purchase)
  const checkPurchaseContribution = useCallback(async (purchaseId: string) => {
    try {
      const response = await fetch(
        `/api/contributions?purchaseId=${purchaseId}`
      );
      if (!response.ok) {
        setUserHasContributed(false);
        return;
      }

      const data = await response.json();
      const contributions = data.contributions || [];

      // Check if ANY contribution exists for this purchase
      const hasContributed = contributions.length > 0;
      setUserHasContributed(hasContributed);
      setShowContributionWarning(hasContributed); // Show warning when contribution exists
    } catch (error) {
      console.error('Error checking purchase contribution:', error);
      setUserHasContributed(false);
      setShowContributionWarning(false);
    }
  }, []);

  const fetchPreviousPurchaseForTokens = async (
    currentPurchaseDate: string
  ) => {
    try {
      // Find the previous purchase before the current purchase date
      const response = await fetch(
        `/api/purchases?before=${currentPurchaseDate}&limit=1`
      );
      if (!response.ok) {
        setPreviousMeterReading(0);
        return;
      }

      const data = await response.json();
      const previousPurchase = data.purchases?.[0];

      if (previousPurchase) {
        // Set previous meter reading for tokens consumed calculation
        setPreviousMeterReading(previousPurchase.meterReading);
      } else {
        // No previous purchase - first purchase, so no previous consumption
        setPreviousMeterReading(0);
      }
    } catch (error) {
      console.error('Error fetching previous purchase:', error);
      setPreviousMeterReading(0);
    }
  };

  const fetchPurchaseAndPreviousReading = useCallback(
    async (purchaseId: string) => {
      try {
        setLoadingPreviousReading(true);
        const response = await fetch(`/api/purchases/${purchaseId}`);
        if (!response.ok) {
          setPreviousMeterReading(0);
          return;
        }

        const purchase = await response.json();

        if (purchase && purchase.meterReading !== undefined) {
          // Set contribution meter reading to match purchase meter reading (constraint 2)
          setValue('meterReading', purchase.meterReading);

          // Fetch previous purchase to calculate tokens consumed
          await fetchPreviousPurchaseForTokens(purchase.purchaseDate);

          // Ensure validation is in a valid state since meter reading is set automatically
          setMeterReadingValidation({
            isValidating: false,
            isValid: true,
          });
        } else {
          setPreviousMeterReading(0);
        }
      } catch (error) {
        console.error('Error fetching purchase meter reading:', error);
        setPreviousMeterReading(0);
      } finally {
        setLoadingPreviousReading(false);
      }
    },
    [setValue]
  );

  const fetchPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const response = await fetch('/api/purchases');
      if (!response.ok) throw new Error('Failed to fetch purchases');

      const data = await response.json();
      setPurchases(data.purchases || []);

      // If a specific purchase was preselected, set it and trigger related logic
      if (selectedPurchaseId) {
        setValue('purchaseId', selectedPurchaseId);
        // Find the purchase and trigger the necessary side effects
        const purchase = data.purchases?.find(
          (p: Purchase) => p.id === selectedPurchaseId
        );
        if (purchase) {
          setSelectedPurchase(purchase);
          // Trigger the purchase-related data fetching
          fetchPurchaseAndPreviousReading(purchase.id);
          checkPurchaseContribution(purchase.id);
        }
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

  // Fetch purchases on component mount
  useEffect(() => {
    fetchPurchases();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process purchases to identify which ones have contributions
  useEffect(() => {
    if (purchases.length > 0) {
      // Create a set of purchase IDs that have ANY contribution (not user-specific)
      const purchasesWithContributions = new Set<string>();

      purchases.forEach((purchase) => {
        // Check if this purchase has a contribution (one-to-one relationship)
        if (purchase.contribution) {
          purchasesWithContributions.add(purchase.id);
        }
      });

      setContributedPurchaseIds(purchasesWithContributions);
    }
  }, [purchases]);

  // Update selected purchase when purchaseId changes
  useEffect(() => {
    if (watchedValues.purchaseId && purchases.length > 0) {
      const purchase = purchases.find((p) => p.id === watchedValues.purchaseId);
      setSelectedPurchase(purchase || null);

      // Fetch the purchase and previous purchase info
      if (purchase) {
        fetchPurchaseAndPreviousReading(purchase.id);
        checkPurchaseContribution(purchase.id);
      }
    }
  }, [
    watchedValues.purchaseId,
    purchases,
    checkPurchaseContribution,
    fetchPurchaseAndPreviousReading,
  ]);

  // Check if this purchase already has a contribution when purchase changes
  useEffect(() => {
    if (watchedValues.purchaseId) {
      checkPurchaseContribution(watchedValues.purchaseId);
    }
  }, [watchedValues.purchaseId, checkPurchaseContribution]);

  // Auto-calculate tokens consumed from previous purchase meter reading
  useEffect(() => {
    if (watchedValues.meterReading && previousMeterReading >= 0) {
      // Tokens consumed = current purchase meter reading - previous purchase meter reading
      const tokensConsumed = Math.max(
        0,
        watchedValues.meterReading - previousMeterReading
      );
      setValue('tokensConsumed', tokensConsumed);
    }
  }, [watchedValues.meterReading, previousMeterReading, setValue]);

  // Validate meter reading when it changes
  useEffect(() => {
    if (watchedValues.meterReading && watchedValues.purchaseId) {
      const debounceTimer = setTimeout(() => {
        validateContributionMeterReading(
          watchedValues.meterReading,
          watchedValues.purchaseId
        );
      }, 500); // Debounce for 500ms

      return () => clearTimeout(debounceTimer);
    }
  }, [watchedValues.meterReading, watchedValues.purchaseId]);

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

    const usedTokens = selectedPurchase.contribution?.tokensConsumed || 0;

    return selectedPurchase.totalTokens - usedTokens;
  };

  const clearFormAndSelection = () => {
    reset();
    setSelectedPurchase(null);
    setUserHasContributed(false);
    setShowContributionWarning(false);
    setPreviousMeterReading(0);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const dismissContributionWarning = () => {
    setShowContributionWarning(false);
  };

  // Validate contribution meter reading
  const validateContributionMeterReading = async (
    reading: number,
    purchaseId: string
  ) => {
    if (!reading || !purchaseId) return;

    setMeterReadingValidation({ isValidating: true, isValid: true });

    try {
      const response = await fetch('/api/validate-contribution-meter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterReading: reading,
          purchaseId: purchaseId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMeterReadingValidation({
          isValidating: false,
          isValid: result.valid,
          error: result.error,
          suggestedMinimum: result.suggestedMinimum,
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
  };

  // Analyze historical consumption patterns for contribution suggestion
  const analyzeHistoricalConsumption = useCallback(
    async (
      userId: string,
      currentTokensConsumed: number,
      currentPurchase: Purchase
    ) => {
      if (!userId || !currentTokensConsumed || !currentPurchase) {
        setHistoricalSuggestion(null);
        return;
      }

      setHistoricalSuggestion((prev) => ({
        ...prev,
        loading: true,
        suggestedAmount: 0,
        averageUsage: 0,
        averageContribution: 0,
        totalContributions: 0,
        efficiencyScore: 0,
        confidence: 'low' as const,
        reasoning: 'Analyzing...',
      }));

      try {
        const response = await fetch(
          `/api/contributions?userId=${userId}&limit=10`
        );
        if (!response.ok) {
          setHistoricalSuggestion(null);
          return;
        }

        const data = await response.json();
        const userContributions = data.contributions || [];

        if (userContributions.length === 0) {
          // No historical data - use current purchase fair share
          const fairShare =
            (currentTokensConsumed / currentPurchase.totalTokens) *
            currentPurchase.totalPayment;
          setHistoricalSuggestion({
            loading: false,
            suggestedAmount: fairShare,
            averageUsage: currentTokensConsumed,
            averageContribution: fairShare,
            totalContributions: 0,
            efficiencyScore: 100,
            confidence: 'medium',
            reasoning: 'Based on fair share (no historical data available)',
          });
          return;
        }

        // Calculate historical patterns
        const totalUsage = userContributions.reduce(
          (sum: number, c: { tokensConsumed: number }) =>
            sum + c.tokensConsumed,
          0
        );
        const totalPaid = userContributions.reduce(
          (sum: number, c: { contributionAmount: number }) =>
            sum + c.contributionAmount,
          0
        );
        const avgUsage = totalUsage / userContributions.length;
        const avgContribution = totalPaid / userContributions.length;

        // Calculate efficiency scores (how close to fair share)
        const efficiencies = userContributions.map(
          (c: {
            tokensConsumed: number;
            contributionAmount: number;
            purchase: { totalTokens: number; totalPayment: number };
          }) => {
            const fairShare =
              (c.tokensConsumed / c.purchase.totalTokens) *
              c.purchase.totalPayment;
            return fairShare > 0
              ? (c.contributionAmount / fairShare) * 100
              : 100;
          }
        );
        const avgEfficiency =
          efficiencies.reduce((sum: number, eff: number) => sum + eff, 0) /
          efficiencies.length;

        // Calculate average cost per kWh from historical data
        const avgCostPerKwh =
          totalUsage > 0
            ? totalPaid / totalUsage
            : currentPurchase.totalPayment / currentPurchase.totalTokens;

        // Generate suggestion based on patterns
        let suggestedAmount: number;
        let confidence: 'high' | 'medium' | 'low';
        let reasoning: string;

        if (userContributions.length >= 5) {
          // High confidence: Use historical average cost per kWh
          suggestedAmount = currentTokensConsumed * avgCostPerKwh;
          confidence = 'high';
          reasoning = `Based on your average of $${avgCostPerKwh.toFixed(4)}/kWh from ${userContributions.length} contributions`;
        } else if (userContributions.length >= 2) {
          // Medium confidence: Blend historical and current fair share
          const fairShare =
            (currentTokensConsumed / currentPurchase.totalTokens) *
            currentPurchase.totalPayment;
          const historicalEstimate = currentTokensConsumed * avgCostPerKwh;
          suggestedAmount = (fairShare + historicalEstimate) / 2;
          confidence = 'medium';
          reasoning = `Blended estimate from ${userContributions.length} contributions and current purchase rate`;
        } else {
          // Low confidence: Use current fair share adjusted by historical efficiency
          const fairShare =
            (currentTokensConsumed / currentPurchase.totalTokens) *
            currentPurchase.totalPayment;
          suggestedAmount = fairShare * (avgEfficiency / 100);
          confidence = 'low';
          reasoning = `Limited data (${userContributions.length} contributions) - adjusted fair share`;
        }

        setHistoricalSuggestion({
          loading: false,
          suggestedAmount: Math.max(0, suggestedAmount),
          averageUsage: avgUsage,
          averageContribution: avgContribution,
          totalContributions: userContributions.length,
          efficiencyScore: avgEfficiency,
          confidence,
          reasoning,
        });
      } catch (error) {
        console.error('Error analyzing historical consumption:', error);
        setHistoricalSuggestion(null);
      }
    },
    []
  );

  // Analyze historical consumption when tokens consumed changes
  useEffect(() => {
    if (watchedValues.tokensConsumed > 0 && selectedPurchase && currentUserId) {
      const debounceTimer = setTimeout(() => {
        analyzeHistoricalConsumption(
          currentUserId,
          watchedValues.tokensConsumed,
          selectedPurchase
        );
      }, 800); // Slight delay to avoid too many API calls

      return () => clearTimeout(debounceTimer);
    } else {
      setHistoricalSuggestion(null);
    }
  }, [
    watchedValues.tokensConsumed,
    selectedPurchase,
    currentUserId,
    analyzeHistoricalConsumption,
  ]);

  const handleFormSubmit = async (data: ContributionFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      // Prepare submission data - always use current user
      const submitData: CreateUserContributionInput = {
        purchaseId: data.purchaseId,
        contributionAmount: data.contributionAmount,
        meterReading: data.meterReading,
        tokensConsumed: data.tokensConsumed,
        userId: currentUserId!, // Always current user - enforced by new business rules
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

      {userHasContributed && selectedPurchase && showContributionWarning && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-medium">Purchase Already Has Contribution</p>
                <p className="text-sm mt-1">
                  This token purchase from{' '}
                  {new Date(selectedPurchase.purchaseDate).toLocaleDateString()}{' '}
                  already has a contribution recorded. Only one contribution is
                  allowed per purchase. Please select a different purchase.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearFormAndSelection}
                    className="text-xs"
                  >
                    Select Different Purchase
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={dismissContributionWarning}
                    className="text-xs"
                  >
                    Dismiss Warning
                  </Button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissContributionWarning}
              className="text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                disabled={userHasContributed || !!selectedPurchaseId}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
                style={{
                  background: 'white',
                  color: 'black',
                }}
              >
                <option value="">Select a purchase...</option>
                {purchases.map((purchase) => {
                  const hasContributed = contributedPurchaseIds.has(
                    purchase.id
                  );
                  const canContribute = purchase.canContribute;

                  return (
                    <option
                      key={purchase.id}
                      value={purchase.id}
                      disabled={!canContribute}
                      style={{
                        backgroundColor: hasContributed
                          ? '#fef3c7'
                          : canContribute
                            ? 'white'
                            : '#f3f4f6',
                        color: hasContributed
                          ? '#d97706'
                          : canContribute
                            ? 'black'
                            : '#9ca3af',
                        fontWeight: hasContributed ? 'bold' : 'normal',
                      }}
                    >
                      {hasContributed ? '✓ ' : canContribute ? '' : '⏳ '}
                      {new Date(
                        purchase.purchaseDate
                      ).toLocaleDateString()} - {purchase.totalTokens} tokens (
                      {purchase.isEmergency ? 'Emergency' : 'Regular'})
                      {hasContributed
                        ? ' - Already Contributed'
                        : canContribute
                          ? ''
                          : ' - Contribute to older purchases first'}
                    </option>
                  );
                })}
              </select>
              <FormDescription>
                {selectedPurchaseId ? (
                  <span className="text-blue-600 dark:text-blue-400">
                    Pre-selected token purchase (read-only)
                  </span>
                ) : (
                  <>
                    <span>
                      Select the token purchase you want to contribute to.
                    </span>
                    {isAdmin ? (
                      <span className="block text-purple-600 dark:text-purple-400 mt-1">
                        🛡️ Admin Override: You can contribute to any purchase
                        regardless of order
                      </span>
                    ) : (
                      <span className="block text-blue-600 dark:text-blue-400 mt-1">
                        💡 You must contribute to purchases in chronological
                        order (oldest first)
                      </span>
                    )}
                  </>
                )}
                {contributedPurchaseIds.size > 0 && !selectedPurchaseId && (
                  <span className="block text-amber-600 dark:text-amber-400 mt-1">
                    ✓ Highlighted purchases show where you&apos;ve already
                    contributed
                  </span>
                )}
                {!selectedPurchaseId && !isAdmin && (
                  <span className="block text-slate-600 dark:text-slate-400 mt-1">
                    ⏳ Grayed out purchases require older contributions first
                  </span>
                )}
              </FormDescription>
              {errors.purchaseId && (
                <FormMessage>{errors.purchaseId.message}</FormMessage>
              )}
            </FormField>

            {/* Current User Display */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-950 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Contributing User:
                </span>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {session?.user?.name || 'Current User'}
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full dark:bg-purple-900 dark:text-purple-200">
                      ADMIN
                    </span>
                  )}
                </span>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {isAdmin
                  ? 'As an admin, you can bypass sequential contribution constraints'
                  : 'Contributions are now limited to one per purchase per user'}
              </div>
            </div>

            {/* Previous Purchase Meter Reading (for calculation) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Previous Purchase Meter Reading:
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {loadingPreviousReading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500 mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    `${previousMeterReading.toLocaleString()} kWh`
                  )}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Used as baseline for calculating tokens consumed since last
                purchase
              </div>
            </div>

            {/* Contribution Meter Reading (matches purchase) */}
            <FormField>
              <FormLabel htmlFor="meterReading">
                Contribution Meter Reading (kWh) *
              </FormLabel>
              <div className="relative">
                <Input
                  id="meterReading"
                  type="number"
                  step="0.01"
                  value={watchedValues.meterReading || ''}
                  readOnly
                  disabled
                  className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-not-allowed"
                  {...register('meterReading', { valueAsNumber: true })}
                />
              </div>

              <FormDescription>
                This meter reading matches the purchase meter reading and is
                automatically set. Tokens consumed are calculated from the
                previous purchase meter reading.
              </FormDescription>
            </FormField>

            {/* Electricity Consumed (Auto-calculated) */}
            <FormField>
              <FormLabel htmlFor="tokensConsumed">
                Electricity Consumed (kWh) *
              </FormLabel>
              <div className="relative">
                <Input
                  id="tokensConsumed"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100000"
                  value={watchedValues.tokensConsumed || 0}
                  readOnly
                  disabled={userHasContributed}
                  className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-not-allowed"
                  {...register('tokensConsumed', { valueAsNumber: true })}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Calculator className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <FormDescription>
                Automatically calculated: Current meter reading (
                {watchedValues.meterReading || 0}) - Previous purchase reading (
                {previousMeterReading}) ={' '}
                {Math.max(
                  0,
                  (watchedValues.meterReading || 0) - previousMeterReading
                )}{' '}
                kWh
              </FormDescription>
              {errors.tokensConsumed && (
                <FormMessage>{errors.tokensConsumed.message}</FormMessage>
              )}
            </FormField>

            {/* Expected Contribution Amount (Computed) */}
            {watchedValues.tokensConsumed > 0 && selectedPurchase && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Expected Contribution (based on usage):
                  </span>
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    $
                    {(
                      (watchedValues.tokensConsumed /
                        selectedPurchase.totalTokens) *
                      selectedPurchase.totalPayment
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {watchedValues.tokensConsumed} tokens × $
                  {(
                    selectedPurchase.totalPayment / selectedPurchase.totalTokens
                  ).toFixed(4)}
                  /token
                </div>
              </div>
            )}

            {/* Historical Consumption Analysis */}
            {historicalSuggestion && watchedValues.tokensConsumed > 0 && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-md dark:from-purple-950 dark:to-blue-950 dark:border-purple-800">
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Smart Contribution Suggestion
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      historicalSuggestion.confidence === 'high'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : historicalSuggestion.confidence === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {historicalSuggestion.confidence} confidence
                  </span>
                </h4>

                {historicalSuggestion.loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                    <span className="text-sm text-purple-700 dark:text-purple-300">
                      Analyzing your consumption patterns...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-purple-900 dark:text-purple-100">
                        Suggested Amount: $
                        {historicalSuggestion.suggestedAmount.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setValue(
                            'contributionAmount',
                            historicalSuggestion.suggestedAmount
                          )
                        }
                        className="px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Use This Amount
                      </button>
                    </div>

                    <div className="text-xs text-purple-700 dark:text-purple-300">
                      {historicalSuggestion.reasoning}
                    </div>

                    {historicalSuggestion.totalContributions > 0 && (
                      <div className="grid grid-cols-2 gap-4 text-xs text-purple-600 dark:text-purple-400">
                        <div>
                          <div className="font-medium">Your History:</div>
                          <div>
                            • {historicalSuggestion.totalContributions}{' '}
                            contributions
                          </div>
                          <div>
                            • Avg usage:{' '}
                            {historicalSuggestion.averageUsage.toFixed(0)} kWh
                          </div>
                          <div>
                            • Avg payment: $
                            {historicalSuggestion.averageContribution.toFixed(
                              2
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Payment Accuracy:</div>
                          <div
                            className={`font-semibold ${
                              historicalSuggestion.efficiencyScore >= 95
                                ? 'text-green-600 dark:text-green-400'
                                : historicalSuggestion.efficiencyScore >= 85
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {historicalSuggestion.efficiencyScore.toFixed(1)}%
                            efficiency
                          </div>
                          <div className="text-xs">
                            {historicalSuggestion.efficiencyScore >= 95
                              ? 'Excellent payment accuracy!'
                              : historicalSuggestion.efficiencyScore >= 85
                                ? 'Good payment accuracy'
                                : 'Consider adjusting payments'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
                  placeholder={
                    watchedValues.tokensConsumed > 0 && selectedPurchase
                      ? (
                          (watchedValues.tokensConsumed /
                            selectedPurchase.totalTokens) *
                          selectedPurchase.totalPayment
                        ).toFixed(2)
                      : '0.00'
                  }
                  disabled={userHasContributed}
                  className={`pl-10 ${errors.contributionAmount ? 'border-red-500' : ''}`}
                  {...register('contributionAmount', { valueAsNumber: true })}
                />
              </div>
              <FormDescription>
                Enter the amount you are contributing for this usage
                {watchedValues.tokensConsumed > 0 && selectedPurchase && (
                  <span className="block text-blue-600 dark:text-blue-400 mt-1">
                    💡 Suggested: $
                    {(
                      (watchedValues.tokensConsumed /
                        selectedPurchase.totalTokens) *
                      selectedPurchase.totalPayment
                    ).toFixed(2)}{' '}
                    based on your usage
                  </span>
                )}
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
            onClick={clearFormAndSelection}
            disabled={isLoading}
            className="text-slate-900 dark:text-slate-50"
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading ||
              userHasContributed ||
              watchedValues.tokensConsumed > getRemainingTokens() ||
              !meterReadingValidation.isValid ||
              meterReadingValidation.isValidating
            }
            className="min-w-[120px] bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 disabled:bg-slate-400 disabled:text-slate-600 dark:disabled:bg-slate-600 dark:disabled:text-slate-400"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </div>
            ) : userHasContributed ? (
              'Already Contributed'
            ) : (
              'Record Contribution'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}
