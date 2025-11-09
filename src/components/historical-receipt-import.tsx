'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { formatZWG } from '@/lib/utils';

interface ReceiptRow {
  transactionDateTime: string;
  tokenNumber?: string;
  accountNumber?: string;
  kwhPurchased: number;
  energyCostZWG: number;
  debtZWG: number;
  reaZWG: number;
  vatZWG: number;
  totalAmountZWG: number;
  tenderedZWG: number;
}

interface MatchPreview {
  row: number;
  receipt: ReceiptRow;
  purchaseId: string | null;
  purchaseDate?: string;
  purchaseTokens?: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
  confidenceScore: number;
  reasons: string[];
  warnings: string[];
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  matches: Array<{
    row: number;
    purchaseId: string | null;
    confidence: string;
    confidenceScore: number;
    imported: boolean;
    error?: string;
  }>;
}

export function HistoricalReceiptImport() {
  const { success: showSuccess, error: showError } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<MatchPreview[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Array<{ row: number; errors: string[] }>
  >([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showDetails, setShowDetails] = useState<Record<number, boolean>>({});

  // Parse CSV file
  const parseCSV = useCallback((text: string): ReceiptRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const receipts: ReceiptRow[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map((v) => v.trim());

      receipts.push({
        transactionDateTime: values[0] || '',
        tokenNumber: values[1] || undefined,
        accountNumber: values[2] || undefined,
        kwhPurchased: parseFloat(values[3]) || 0,
        energyCostZWG: parseFloat(values[4]) || 0,
        debtZWG: parseFloat(values[5]) || 0,
        reaZWG: parseFloat(values[6]) || 0,
        vatZWG: parseFloat(values[7]) || 0,
        totalAmountZWG: parseFloat(values[8]) || 0,
        tenderedZWG: parseFloat(values[9]) || 0,
      });
    }

    return receipts;
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setPreview(null);
      setImportResult(null);
      setValidationErrors([]);
    } else {
      showError('Please upload a CSV file');
    }
  }, [showError]);

  // Handle file select
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
      setImportResult(null);
      setValidationErrors([]);
    }
  }, []);

  // Preview import
  const handlePreview = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const receipts = parseCSV(text);

      if (receipts.length === 0) {
        showError('No valid receipts found in CSV file');
        setIsLoading(false);
        return;
      }

      // Send to API for matching
      const response = await fetch('/api/receipt-data/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipts, autoImport: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to preview import');
      }

      const data = await response.json();

      if (data.validationErrors) {
        setValidationErrors(data.validationErrors);
      }

      if (data.matches) {
        setPreview(data.matches);
        showSuccess(`Preview ready: ${data.matches.length} receipts to match`);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to preview import');
    } finally {
      setIsLoading(false);
    }
  }, [file, parseCSV, showError, showSuccess]);

  // Execute import
  const handleImport = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const receipts = parseCSV(text);

      // Send to API for import
      const response = await fetch('/api/receipt-data/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipts, autoImport: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import receipts');
      }

      const result: ImportResult = await response.json();
      setImportResult(result);
      setPreview(null);

      if (result.successfulImports > 0) {
        showSuccess(
          `Successfully imported ${result.successfulImports} of ${result.totalRows} receipts`
        );
      } else {
        showError('No receipts were imported. Check the results for details.');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to import receipts');
    } finally {
      setIsLoading(false);
    }
  }, [file, parseCSV, showError, showSuccess]);

  // Download template
  const handleDownloadTemplate = useCallback(() => {
    const link = document.createElement('a');
    link.href = '/receipt-import-template.csv';
    link.download = 'receipt-import-template.csv';
    link.click();
  }, []);

  // Toggle row details
  const toggleDetails = (row: number) => {
    setShowDetails((prev) => ({ ...prev, [row]: !prev[row] }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            Historical Receipt Import
          </CardTitle>
          <CardDescription>
            Bulk import receipt data from CSV file. Receipts will be automatically matched to
            existing purchases.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="font-medium text-blue-900">Need a template?</p>
              <p className="text-sm text-blue-700">
                Download our CSV template with sample data and instructions
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {file ? file.name : 'Drop CSV file here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Maximum 500 receipts per file
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" asChild>
                <span className="cursor-pointer">Choose File</span>
              </Button>
            </label>
          </div>

          {/* Actions */}
          {file && !importResult && (
            <div className="flex gap-4">
              <Button
                onClick={handlePreview}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Preview Matches</>
                )}
              </Button>
              {preview && (
                <Button
                  onClick={handleImport}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>Import {preview.length} Receipts</>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Validation Errors ({validationErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationErrors.map((error) => (
                    <div key={error.row} className="text-sm">
                      <p className="font-medium text-yellow-900">Row {error.row}:</p>
                      <ul className="list-disc list-inside text-yellow-800">
                        {error.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Table */}
          {preview && preview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Match Preview ({preview.length} receipts)</CardTitle>
                <CardDescription>
                  Review automatic matches before importing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {preview.map((match) => (
                    <div
                      key={match.row}
                      className={`p-4 rounded-lg border ${
                        match.confidence === 'high'
                          ? 'border-green-200 bg-green-50'
                          : match.confidence === 'medium'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {match.confidence === 'high' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : match.confidence === 'medium' ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className="font-medium">
                              Row {match.row}: {match.receipt.transactionDateTime}
                            </span>
                            <span className="text-sm text-gray-600">
                              ({match.receipt.kwhPurchased.toFixed(2)} kWh,{' '}
                              {formatZWG(match.receipt.totalAmountZWG)})
                            </span>
                          </div>
                          <div className="mt-1 text-sm">
                            {match.purchaseId ? (
                              <span className="text-gray-700">
                                Match: {new Date(match.purchaseDate!).toLocaleDateString()},{' '}
                                {match.purchaseTokens?.toFixed(2)} kWh ({match.confidenceScore}%
                                confidence)
                              </span>
                            ) : (
                              <span className="text-red-700">No matching purchase found</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDetails(match.row)}
                        >
                          {showDetails[match.row] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Expandable Details */}
                      {showDetails[match.row] && (
                        <div className="mt-3 pt-3 border-t text-sm space-y-2">
                          <div>
                            <p className="font-medium">Reasons:</p>
                            <ul className="list-disc list-inside">
                              {match.reasons.map((reason, i) => (
                                <li key={i}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                          {match.warnings.length > 0 && (
                            <div>
                              <p className="font-medium text-yellow-800">Warnings:</p>
                              <ul className="list-disc list-inside text-yellow-700">
                                {match.warnings.map((warning, i) => (
                                  <li key={i}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">Import Complete</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {importResult.totalRows}
                    </p>
                    <p className="text-sm text-gray-600">Total Rows</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {importResult.successfulImports}
                    </p>
                    <p className="text-sm text-gray-600">Imported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {importResult.failedImports}
                    </p>
                    <p className="text-sm text-gray-600">Failed</p>
                  </div>
                </div>

                {/* Failed imports details */}
                {importResult.failedImports > 0 && (
                  <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                    {importResult.matches
                      .filter((m) => !m.imported)
                      .map((match) => (
                        <div
                          key={match.row}
                          className="p-2 bg-white rounded border border-red-200 text-sm"
                        >
                          <p className="font-medium">Row {match.row}: Failed</p>
                          <p className="text-red-700">
                            {match.error || 'Unknown error'}
                          </p>
                        </div>
                      ))}
                  </div>
                )}

                <Button
                  onClick={() => {
                    setFile(null);
                    setImportResult(null);
                    setPreview(null);
                  }}
                  className="w-full mt-4"
                >
                  Import Another File
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
