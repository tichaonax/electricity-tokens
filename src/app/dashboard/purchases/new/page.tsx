'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PurchaseForm } from '@/components/purchase-form';
import { type CreateTokenPurchaseInput } from '@/lib/validations';

export default function NewPurchasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSubmit = async (data: CreateTokenPurchaseInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create purchase');
      }

      const result = await response.json();
      // console.log removed

      // Redirect to purchases list after successful creation
      setTimeout(() => {
        router.push('/dashboard/purchases');
      }, 2000);
    } catch (error) {
      // console.error removed
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white shadow dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                New Token Purchase
              </h1>
            </div>
            <div className="flex items-center space-x-4">
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
          <PurchaseForm onSubmit={handleSubmit} isLoading={isSubmitting} />
        </div>
      </main>
    </div>
  );
}
