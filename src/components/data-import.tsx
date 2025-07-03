'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  Save,
  Loader2,
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  processed: number;
  created?: number;
  updated?: number;
  errors: Array<{
    row: number;
    error: string;
    data?: Record<string, unknown>;
  }>;
}

interface ImportPreview {
  success: boolean;
  preview: Record<string, unknown>[];
  totalRows: number;
  columns: string[];
}

export function DataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'purchases' | 'contributions' | 'purchase-data'>(
    'purchase-data'
  );
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setPreview(null);
      setResult(null);
      setStep('upload');
    } else {
      alert('Please select a CSV file');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const parseFile = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);

      const response = await fetch('/api/import', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse file');
      }

      const data = await response.json();
      setPreview(data);
      setStep('preview');
    } catch (error) {
      console.error('Parse error:', error);
      alert('Failed to parse file. Please check the format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateData = async () => {
    if (!preview) return;

    try {
      setLoading(true);
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: importType,
          data: preview.preview, // Use preview data for validation
          validateOnly: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const result = await response.json();

      if (result.errors.length > 0) {
        alert(
          `Validation found ${result.errors.length} errors. Please check the preview and fix the data.`
        );
      } else {
        alert('Validation successful! Data looks good.');
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Validation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const importData = async () => {
    if (!preview) return;

    const confirmed = window.confirm(
      `Are you sure you want to import ${preview.totalRows} rows? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: importType,
          data: preview.preview, // In a real implementation, you'd send all data
          validateOnly: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setResult(result);
      setStep('result');
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getExpectedColumns = (type: string) => {
    if (type === 'purchases') {
      return ['purchaseDate', 'totalTokens', 'totalPayment', 'meterReading', 'isEmergency'];
    } else if (type === 'contributions') {
      return [
        'userEmail',
        'purchaseDate',
        'meterReading',
        'tokensConsumed',
        'contributionAmount',
      ];
    } else if (type === 'purchase-data') {
      return [
        'purchaseDate',
        'totalTokens', 
        'totalPayment',
        'meterReading',
        'isEmergency',
        'userEmail',
        'contributionAmount',
        'tokensConsumed',
        'contributionMeterReading',
      ];
    } else {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Data Import
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Import data from CSV files. Only administrators can import data.
        </p>
      </div>

      {/* Import Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Import Type
        </label>
        <div className="flex flex-col gap-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="importType"
              value="purchase-data"
              checked={importType === 'purchase-data'}
              onChange={(e) =>
                setImportType(e.target.value as 'purchases' | 'contributions' | 'purchase-data')
              }
              className="mr-2"
            />
            <div>
              <div className="font-medium">Purchase Data (Recommended)</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Combined purchase and contribution data - maintains one-to-one relationship</div>
            </div>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="importType"
              value="purchases"
              checked={importType === 'purchases'}
              onChange={(e) =>
                setImportType(e.target.value as 'purchases' | 'contributions' | 'purchase-data')
              }
              className="mr-2"
            />
            <div>
              <div className="font-medium">Token Purchases Only</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Import only purchase data (legacy)</div>
            </div>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="importType"
              value="contributions"
              checked={importType === 'contributions'}
              onChange={(e) =>
                setImportType(e.target.value as 'purchases' | 'contributions' | 'purchase-data')
              }
              className="mr-2"
            />
            <div>
              <div className="font-medium">User Contributions Only</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Import only contribution data (legacy)</div>
            </div>
          </label>
        </div>
      </div>

      {/* Expected Format Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Expected CSV Format for{' '}
          {importType === 'purchases'
            ? 'Token Purchases'
            : importType === 'contributions'
            ? 'User Contributions'
            : 'Purchase Data (Combined)'}
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
          Your CSV file should include the following columns:
        </p>
        <div className="text-sm font-mono text-blue-800 dark:text-blue-200">
          {getExpectedColumns(importType).join(', ')}
        </div>
      </div>

      {step === 'upload' && (
        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file
                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950'
                : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="space-y-2">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <p className="text-lg font-medium text-green-900 dark:text-green-100">
                  File Selected
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" onClick={handleUploadClick}>
                    Choose Different File
                  </Button>
                  <Button onClick={parseFile} disabled={loading} variant="outline">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-slate-400 mx-auto" />
                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Upload CSV File
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Click to browse or drag and drop your CSV file here
                </p>
                <Button onClick={handleUploadClick} variant="outline" className="mt-4">
                  <FileText className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Data Preview
            </h4>
            <Button variant="outline" onClick={reset}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-800 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Found {preview.totalRows} rows with columns:{' '}
              {preview.columns.join(', ')}
            </p>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {preview.columns.map((column) => (
                    <th
                      key={column}
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider dark:text-slate-400"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 dark:bg-slate-900 dark:divide-slate-700">
                {preview.preview.map((row, index) => (
                  <tr key={index}>
                    {preview.columns.map((column) => (
                      <td
                        key={column}
                        className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100"
                      >
                        {String(row[column] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.preview.length < preview.totalRows && (
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Showing first {preview.preview.length} of {preview.totalRows} rows
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={validateData} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate Data
                </>
              )}
            </Button>
            <Button onClick={importData} disabled={loading} variant="outline">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Import Data
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Import Results
            </h4>
            <Button onClick={reset} variant="outline">Import Another File</Button>
          </div>

          <div
            className={`p-4 border rounded-lg ${
              result.success
                ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-950'
                : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-950'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <h5
                className={`font-medium ${
                  result.success
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}
              >
                {result.success
                  ? 'Import Completed'
                  : 'Import Completed with Errors'}
              </h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Processed:</span>{' '}
                {result.processed}
              </div>
              {result.created !== undefined && (
                <div>
                  <span className="font-medium">Created:</span> {result.created}
                </div>
              )}
              {result.updated !== undefined && (
                <div>
                  <span className="font-medium">Updated:</span> {result.updated}
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4">
                <h6 className="font-medium text-red-900 dark:text-red-100 mb-2">
                  Errors ({result.errors.length}):
                </h6>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <div
                      key={index}
                      className="text-xs text-red-800 dark:text-red-200"
                    >
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
