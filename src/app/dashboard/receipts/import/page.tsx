import { HistoricalReceiptImport } from '@/components/historical-receipt-import';

export const metadata = {
  title: 'Import Historical Receipts | Electricity Tokens',
  description: 'Bulk import historical receipt data from CSV',
};

export default function ImportReceiptsPage() {
  return <HistoricalReceiptImport />;
}
