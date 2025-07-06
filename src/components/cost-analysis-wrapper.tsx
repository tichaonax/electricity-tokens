'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const CostAnalysisClient = dynamic(
  () => import('@/components/cost-analysis-client').then(mod => ({ default: mod.CostAnalysisClient })),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: false
  }
);

export function CostAnalysisWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CostAnalysisClient />
    </Suspense>
  );
}