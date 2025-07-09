'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PurchaseForm } from '@/components/purchase-form';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Purchase {
  id: string;
  totalTokens: number;
  totalPayment: number;
  meterReading: number;
  purchaseDate: string;
  isEmergency: boolean;
  creator: {
    id: string;
    name: string;
  };
}

export default function EditPurchasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const purchaseId = params.id as string;

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && purchaseId) {
      fetchPurchase();
    }
  }, [status, router, purchaseId]); // fetchPurchase is called conditionally, which is intentional

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/purchases/${purchaseId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Purchase not found');
        } else if (response.status === 403) {
          setError('You do not have permission to edit this purchase');
        } else {
          setError('Failed to load purchase');
        }
        return;
      }

      const data = await response.json();
      setPurchase(data);
    } catch (error) {
      // console.error removed
      setError('Failed to load purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/dashboard/purchases/history');
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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <nav className="bg-white shadow dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/dashboard/purchases/history')}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to History</span>
                  <span className="sm:hidden">History</span>
                </Button>
                <div className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    Edit Purchase
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-2 sm:px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow-lg dark:bg-slate-900 p-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
                <h3 className="text-lg font-medium mb-2">
                  Error Loading Purchase
                </h3>
                <p>{error}</p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/purchases/history')}
                  className="mt-4"
                >
                  Return to Purchase History
                </Button>
              </div>
            </div>
          </div>
        </main>
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
                onClick={() => router.push('/dashboard/purchases/history')}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-4 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to History</span>
                <span className="sm:hidden">History</span>
              </button>
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  Edit Purchase
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

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-2 sm:px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg dark:bg-slate-900 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Edit Purchase Details
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Update the purchase information below. Changes will be logged
                for audit purposes.
              </p>
            </div>

            <PurchaseForm
              mode="edit"
              purchaseId={purchaseId}
              initialData={{
                totalTokens: purchase?.totalTokens || 0,
                totalPayment: purchase?.totalPayment || 0,
                meterReading: purchase?.meterReading || 0,
                purchaseDate: purchase?.purchaseDate
                  ? new Date(purchase.purchaseDate).toISOString().split('T')[0]
                  : '',
                isEmergency: purchase?.isEmergency || false,
              }}
              onSuccess={handleSuccess}
              onCancel={() => router.push('/dashboard/purchases/history')}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
