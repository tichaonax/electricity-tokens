/**
 * Bulk Receipt Import API
 * 
 * Handles batch import of historical receipt data from CSV files.
 * Uses intelligent matching algorithm to pair receipts with existing purchases
 * based on date proximity and kWh fuzzy matching.
 * 
 * Key Features:
 * - Validates all receipt data before import
 * - Matches receipts to purchases using confidence scoring
 * - Supports preview mode (dry run) before actual import
 * - Auto-import mode for high/medium confidence matches only
 * - Batch limit: 500 receipts per request
 * 
 * Matching Algorithm (see receipt-matcher.ts):
 * 1. Date Proximity Score (0-50 points): Closer dates = higher score
 * 2. kWh Fuzzy Match (0-50 points): Similar kWh values = higher score
 * 3. Confidence Classification:
 *    - High: 80-100 points (auto-import safe)
 *    - Medium: 60-79 points (review recommended)
 *    - Low: 40-59 points (manual verification required)
 *    - None: <40 points (no suitable match found)
 * 
 * @module api/receipt-data/bulk-import
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { matchReceiptsToPurchases, validateReceiptRow } from '@/lib/receipt-matcher';

/**
 * Receipt row structure from CSV import
 */
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

/**
 * Bulk import result summary
 */
interface BulkImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number; // Number of receipts successfully imported
  failedImports: number; // Number of receipts that failed to import
  validationErrors: Array<{ row: number; errors: string[] }>; // CSV validation errors
  matches: Array<{
    row: number; // Row number in CSV
    purchaseId: string | null; // Matched purchase ID (null if no match)
    confidence: string; // Confidence level: high, medium, low, none
    confidenceScore: number; // Numeric score 0-100
    imported: boolean; // Whether receipt was imported
    error?: string; // Error message if import failed
  }>;
}

/**
 * POST /api/receipt-data/bulk-import
 * 
 * Import multiple receipt records from CSV data.
 * Supports two modes: preview (dry run) and auto-import (actual import).
 * 
 * Request Body:
 * - receipts (required): Array of ReceiptRow objects from CSV
 * - autoImport (optional): Boolean - if false, returns preview; if true, performs import
 * 
 * Preview Mode (autoImport=false, default):
 * - Validates all rows
 * - Matches receipts to purchases
 * - Returns confidence scores and match details
 * - Does NOT create any database records
 * - User can review matches before confirming import
 * 
 * Auto-Import Mode (autoImport=true):
 * - Validates all rows
 * - Matches receipts to purchases
 * - Automatically imports HIGH and MEDIUM confidence matches
 * - Skips LOW and NONE confidence matches (manual review required)
 * - Returns import results with success/failure counts
 * 
 * Matching Logic (detailed in receipt-matcher.ts):
 * Step 1: Date Proximity Scoring (50 points max)
 *   - Same day: 50 points
 *   - 1 day apart: 40 points
 *   - 2-3 days: 30 points
 *   - 4-7 days: 20 points
 *   - 8-14 days: 10 points
 *   - >14 days: 0 points
 * 
 * Step 2: kWh Fuzzy Matching (50 points max)
 *   - Exact match: 50 points
 *   - <5% difference: 40 points
 *   - 5-10%: 30 points
 *   - 10-20%: 20 points
 *   - 20-30%: 10 points
 *   - >30%: 0 points
 * 
 * Step 3: Confidence Classification
 *   - 80-100 points: HIGH (safe for auto-import)
 *   - 60-79 points: MEDIUM (likely correct, review recommended)
 *   - 40-59 points: LOW (manual verification required)
 *   - <40 points: NONE (no suitable match found)
 * 
 * Batch Limits:
 * - Minimum: 1 receipt
 * - Maximum: 500 receipts per request (performance optimization)
 * 
 * Authorization:
 * - Requires authenticated user
 * - Admin: Can import receipts for any user's purchases
 * - Regular user: Can only import for own purchases
 * 
 * @returns Preview mode: Match results with confidence scores
 * @returns Auto-import mode: Import results with success/failure counts
 * @returns 400: Invalid request (missing receipts, too many rows, validation errors)
 * @returns 401: Unauthorized (not logged in)
 * @returns 500: Server error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { receipts, autoImport = false } = body as {
      receipts: ReceiptRow[];
      autoImport?: boolean;
    };

    if (!receipts || !Array.isArray(receipts)) {
      return NextResponse.json(
        { error: 'Invalid request: receipts array is required' },
        { status: 400 }
      );
    }

    if (receipts.length === 0) {
      return NextResponse.json(
        { error: 'No receipts provided' },
        { status: 400 }
      );
    }

    if (receipts.length > 500) {
      return NextResponse.json(
        { error: 'Too many receipts (max 500 per batch)' },
        { status: 400 }
      );
    }

    // Validate all rows first
    const validationErrors: Array<{ row: number; errors: string[] }> = [];
    const validReceipts: ReceiptRow[] = [];

    // Check each row for data validation errors (required fields, data types, ranges)
    receipts.forEach((receipt, index) => {
      const validation = validateReceiptRow(receipt, index + 1);
      if (!validation.valid) {
        validationErrors.push({ row: index + 1, errors: validation.errors });
      } else {
        validReceipts.push(receipt);
      }
    });

    // If validation errors and not auto-import, return errors for user review
    if (validationErrors.length > 0 && !autoImport) {
      return NextResponse.json({
        success: false,
        validationErrors,
        totalRows: receipts.length,
        validRows: validReceipts.length,
      });
    }

    // Fetch all purchases for the user (or all if admin)
    // Admin can match receipts to any purchase; regular users only their own
    const purchasesData = await prisma.tokenPurchase.findMany({
      where: session.user.role === 'admin' ? {} : { user: { id: session.user.id } },
      select: {
        id: true,
        purchaseDate: true,
        totalTokens: true, // Used for kWh fuzzy matching
        totalPayment: true,
        meterReading: true,
        receiptData: {
          select: { id: true }, // Check if receipt already exists for this purchase
        },
      },
      orderBy: { purchaseDate: 'asc' },
    });

    // Convert to matcher format
    const purchases = purchasesData.map((p) => ({
      id: p.id,
      purchaseDate: p.purchaseDate.toISOString(),
      totalTokens: p.totalTokens,
      totalPayment: p.totalPayment,
      meterReading: p.meterReading,
      receiptData: p.receiptData,
    }));

    // Match receipts to purchases using intelligent scoring algorithm
    // Algorithm combines date proximity (50 pts) + kWh similarity (50 pts)
    // See receipt-matcher.ts for detailed scoring logic
    const matchResults = matchReceiptsToPurchases(validReceipts, purchases);

    // If not auto-import, return preview for user review
    // Shows all matches with confidence scores and reasons
    if (!autoImport) {
      return NextResponse.json({
        success: true,
        preview: true,
        matches: matchResults.map((match, index) => ({
          row: index + 1,
          receipt: match.receiptRow,
          purchaseId: match.matchedPurchase?.id || null,
          purchaseDate: match.matchedPurchase?.purchaseDate,
          purchaseTokens: match.matchedPurchase?.totalTokens,
          confidence: match.confidence,
          confidenceScore: match.confidenceScore,
          reasons: match.reasons,
          warnings: match.warnings,
        })),
        validationErrors,
        totalRows: receipts.length,
        validRows: validReceipts.length,
      });
    }

    // Auto-import: Create receipt data records in database
    // Only imports HIGH and MEDIUM confidence matches for safety
    // LOW and NONE confidence matches require manual verification
    const importResults = {
      success: true,
      totalRows: receipts.length,
      successfulImports: 0,
      failedImports: 0,
      validationErrors,
      matches: [] as BulkImportResult['matches'],
    };

    // Process each match result
    for (let i = 0; i < matchResults.length; i++) {
      const match = matchResults[i];
      const rowNumber = i + 1;

      // Safety check: Only import high and medium confidence matches
      // This prevents accidental mismatches that could corrupt data
      if (
        (match.confidence === 'high' || match.confidence === 'medium') &&
        match.matchedPurchase
      ) {
        try {
          await prisma.receiptData.create({
            data: {
              purchaseId: match.matchedPurchase.id,
              tokenNumber: match.receiptRow.tokenNumber || null,
              accountNumber: match.receiptRow.accountNumber || null,
              kwhPurchased: match.receiptRow.kwhPurchased,
              energyCostZWG: match.receiptRow.energyCostZWG,
              debtZWG: match.receiptRow.debtZWG,
              reaZWG: match.receiptRow.reaZWG,
              vatZWG: match.receiptRow.vatZWG,
              totalAmountZWG: match.receiptRow.totalAmountZWG,
              tenderedZWG: match.receiptRow.tenderedZWG,
              transactionDateTime: match.receiptRow.transactionDateTime,
            },
          });

          importResults.successfulImports++;
          importResults.matches.push({
            row: rowNumber,
            purchaseId: match.matchedPurchase.id,
            confidence: match.confidence,
            confidenceScore: match.confidenceScore,
            imported: true,
          });
        } catch (error) {
          importResults.failedImports++;
          importResults.matches.push({
            row: rowNumber,
            purchaseId: match.matchedPurchase.id,
            confidence: match.confidence,
            confidenceScore: match.confidenceScore,
            imported: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } else {
        // Low confidence or no match - skip
        importResults.failedImports++;
        importResults.matches.push({
          row: rowNumber,
          purchaseId: match.matchedPurchase?.id || null,
          confidence: match.confidence,
          confidenceScore: match.confidenceScore,
          imported: false,
          error:
            match.confidence === 'none'
              ? 'No suitable purchase found'
              : 'Confidence too low - manual verification required',
        });
      }
    }

    return NextResponse.json(importResults);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      {
        error: 'Failed to import receipts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
