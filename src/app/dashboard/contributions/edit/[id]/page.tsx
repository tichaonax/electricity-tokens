'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertTriangle, DollarSign, Zap, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const editContributionSchema = z.object({
  contributionAmount: z.number()
    .min(0.01, 'Contribution amount must be greater than $0.01')
    .max(10000, 'Contribution amount cannot exceed $10,000'),
  // tokensConsumed is calculated and readonly - removed from schema
});

type EditContributionForm = z.infer<typeof editContributionSchema>;

interface ContributionData {
  id: string;
  contributionAmount: number;
  meterReading: number;
  tokensConsumed: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  purchase: {
    id: string;
    totalTokens: number;
    totalPayment: number;
    meterReading: number;
    purchaseDate: string;
    isEmergency: boolean;
  };
  createdAt: string;
}

function EditContributionContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const contributionId = params.id as string;

  const [contribution, setContribution] = useState<ContributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditContributionForm>({
    resolver: zodResolver(editContributionSchema),
  });

  const watchedValues = watch();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && contributionId) {
      fetchContribution();
    }
  }, [session, contributionId]);

  const fetchContribution = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/contributions/${contributionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contribution');
      }

      const data = await response.json();
      setContribution(data);

      // Set form values
      setValue('contributionAmount', data.contributionAmount);
      // tokensConsumed is calculated and readonly
    } catch (error) {
      // console.error removed
      setError('Failed to load contribution data.');
    } finally {
      setLoading(false);
    }
  };

  const validateContribution = async (contributionAmount: number) => {
    try {
      const response = await fetch('/api/validate-contribution-meter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: contribution?.purchase.id,
          meterReading: contribution?.meterReading, // Keep existing meter reading
          contributionAmount,
          tokensConsumed: contribution?.tokensConsumed, // Use existing calculated value
          contributionId, // For edit validation
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { isValid: false, errors: result.errors || [{ message: result.message }] };
      }

      return { isValid: true, errors: [] };
    } catch (error) {
      return { 
        isValid: false, 
        errors: [{ message: 'Failed to validate contribution' }] 
      };
    }
  };

  const onSubmit = async (data: EditContributionForm) => {
    try {
      setSubmitting(true);
      setError(null);
      setValidationErrors({});

      // Validate the contribution
      const validation = await validateContribution(data.contributionAmount);
      
      if (!validation.isValid) {
        const errors: Record<string, string> = {};
        validation.errors.forEach((error: any) => {
          if (error.field) {
            errors[error.field] = error.message;
          } else {
            setError(error.message);
          }
        });
        setValidationErrors(errors);
        return;
      }

      // Submit the update - only contributionAmount can be edited
      const response = await fetch(`/api/contributions/${contributionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionAmount: data.contributionAmount,
          // tokensConsumed and meterReading are calculated/readonly and not updated
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update contribution');
      }

      // Success - redirect back to contributions
      router.push('/dashboard/contributions');
    } catch (error) {
      // console.error removed
      setError(error instanceof Error ? error.message : 'Failed to update contribution');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate derived values using the readonly tokensConsumed from contribution data
  const calculateTrueCost = () => {
    if (!contribution) return 0;
    return (contribution.tokensConsumed / contribution.purchase.totalTokens) * contribution.purchase.totalPayment;
  };

  const calculateEfficiency = () => {
    const trueCost = calculateTrueCost();
    if (!watchedValues.contributionAmount || trueCost === 0) return 0;
    return (trueCost / watchedValues.contributionAmount) * 100;
  };

  const calculateOverpayment = () => {
    return (watchedValues.contributionAmount || 0) - calculateTrueCost();
  };

  // Permission check
  const canEdit = session?.user?.role === 'ADMIN' || contribution?.user.id === session?.user?.id;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!contribution) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Contribution Not Found
          </h2>
          <Button onClick={() => router.push('/dashboard/contributions')}>
            Back to Contributions
          </Button>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Access Denied
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You don't have permission to edit this contribution.
          </p>
          <Button onClick={() => router.push('/dashboard/contributions')}>
            Back to Contributions
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
                onClick={() => router.push('/dashboard/contributions')}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Edit Contribution
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Purchase Information (Read-only) */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Calendar className="h-5 w-5" />
                  Purchase Information
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Reference information for this contribution (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-white">
                      Purchase Date
                    </label>
                    <p className="text-slate-900 dark:text-blue-300 font-medium">
                      {new Date(contribution.purchase.purchaseDate + 'T00:00:00').toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-white">
                      Purchase Type
                    </label>
                    <p className="text-slate-900 dark:text-slate-100">
                      {contribution.purchase.isEmergency ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Emergency
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Regular
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-white">
                      Total Tokens
                    </label>
                    <p className="text-slate-900 dark:text-blue-300 font-medium">
                      {contribution.purchase.totalTokens.toLocaleString()} kWh
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-white">
                      Total Cost
                    </label>
                    <p className="text-slate-900 dark:text-blue-300 font-medium">
                      ${contribution.purchase.totalPayment.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-white">
                      Meter Reading
                    </label>
                    <p className="text-slate-900 dark:text-blue-300 font-medium">
                      {contribution.meterReading.toLocaleString()} kWh
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-white">
                      Rate per kWh
                    </label>
                    <p className="text-slate-900 dark:text-blue-300 font-medium">
                      ${(contribution.purchase.totalPayment / contribution.purchase.totalTokens).toFixed(4)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Form */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Zap className="h-5 w-5" />
                  Edit Contribution
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Update your contribution amount (tokens consumed is calculated automatically)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">
                      Contribution Amount ($) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('contributionAmount', { valueAsNumber: true })}
                      className={`${errors.contributionAmount || validationErrors.contributionAmount ? 'border-red-300 dark:border-red-600' : ''} dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600`}
                    />
                    {errors.contributionAmount && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contributionAmount.message}</p>
                    )}
                    {validationErrors.contributionAmount && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.contributionAmount}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-white mb-1">
                      Tokens Consumed (kWh) - Calculated
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={contribution.tokensConsumed}
                        readOnly
                        disabled
                        className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Zap className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Automatically calculated: Contribution meter reading ({contribution.meterReading.toLocaleString()}) - Previous purchase meter reading
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard/contributions')}
                      className="flex-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Contribution
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Live Calculations */}
          {watchedValues.contributionAmount && contribution && (
            <Card className="mt-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <DollarSign className="h-5 w-5" />
                  Live Calculations
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Real-time cost analysis based on your inputs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      ${calculateTrueCost().toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">True Cost</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {calculateEfficiency().toFixed(1)}%
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Efficiency</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${calculateOverpayment() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateOverpayment() >= 0 ? '+' : ''}${calculateOverpayment().toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {calculateOverpayment() >= 0 ? 'Overpayment' : 'Underpayment'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      ${(calculateTrueCost() / (contribution.tokensConsumed || 1)).toFixed(4)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Your Rate/kWh</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default function EditContributionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    }>
      <EditContributionContent />
    </Suspense>
  );
}