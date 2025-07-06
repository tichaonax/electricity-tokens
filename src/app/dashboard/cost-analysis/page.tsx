import { CostAnalysisClient } from '@/components/cost-analysis-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cost Analysis - Electricity Tokens',
  description: 'Analyze electricity costs and get recommendations for optimization',
};

export default function CostAnalysisPage() {
  return <CostAnalysisClient />;
}
