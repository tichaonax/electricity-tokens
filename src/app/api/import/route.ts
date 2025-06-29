import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  validateRequest,
  createValidationErrorResponse,
  checkPermissions,
} from '@/lib/validation-middleware';
import { z } from 'zod';

const importSchema = z.object({
  type: z.enum(['purchases', 'contributions']),
  data: z.array(z.record(z.unknown())),
  validateOnly: z.boolean().default(false),
});

interface ImportResult {
  success: boolean;
  processed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: Record<string, unknown>;
  }>;
  created?: number;
  updated?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin permissions
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true, requireAdmin: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 403 }
      );
    }

    // Validate request body
    const validation = await validateRequest(request, {
      body: importSchema,
    });

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    const { body } = validation.data as {
      body: {
        type: 'purchases' | 'contributions';
        data: Record<string, unknown>[];
        validateOnly: boolean;
      };
    };

    const { type, data, validateOnly } = body;

    let result: ImportResult;

    switch (type) {
      case 'purchases':
        result = await importPurchases(
          data,
          validateOnly,
          permissionCheck.user!.id
        );
        break;

      case 'contributions':
        result = await importContributions(data, validateOnly);
        break;

      default:
        return NextResponse.json(
          { message: 'Invalid import type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function importPurchases(
  data: Record<string, unknown>[],
  validateOnly: boolean,
  createdBy: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    processed: 0,
    errors: [],
    created: 0,
    updated: 0,
  };

  const purchaseSchema = z.object({
    purchaseDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }),
    totalTokens: z.number().positive('Total tokens must be positive'),
    totalPayment: z.number().positive('Total payment must be positive'),
    isEmergency: z.boolean().optional().default(false),
  });

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    result.processed++;

    try {
      // Validate row data
      const validatedData = purchaseSchema.parse(row);

      if (!validateOnly) {
        // Check for existing purchase on same date
        const existingPurchase = await prisma.tokenPurchase.findFirst({
          where: {
            purchaseDate: new Date(validatedData.purchaseDate),
            totalTokens: validatedData.totalTokens,
            totalPayment: validatedData.totalPayment,
          },
        });

        if (existingPurchase) {
          // Update existing purchase
          await prisma.tokenPurchase.update({
            where: { id: existingPurchase.id },
            data: {
              totalTokens: validatedData.totalTokens,
              totalPayment: validatedData.totalPayment,
              isEmergency: validatedData.isEmergency,
              updatedAt: new Date(),
            },
          });
          result.updated!++;
        } else {
          // Create new purchase
          await prisma.tokenPurchase.create({
            data: {
              purchaseDate: new Date(validatedData.purchaseDate),
              totalTokens: validatedData.totalTokens,
              totalPayment: validatedData.totalPayment,
              isEmergency: validatedData.isEmergency,
              createdBy,
            },
          });
          result.created!++;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: row,
      });
    }
  }

  return result;
}

async function importContributions(
  data: Record<string, unknown>[],
  validateOnly: boolean
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    processed: 0,
    errors: [],
    created: 0,
    updated: 0,
  };

  const contributionSchema = z.object({
    userEmail: z.string().email('Invalid email format'),
    purchaseDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }),
    meterReading: z.number().positive('Meter reading must be positive'),
    tokensConsumed: z.number().positive('Tokens consumed must be positive'),
    contributionAmount: z
      .number()
      .positive('Contribution amount must be positive'),
  });

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    result.processed++;

    try {
      // Validate row data
      const validatedData = contributionSchema.parse(row);

      if (!validateOnly) {
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: validatedData.userEmail },
        });

        if (!user) {
          throw new Error(
            `User not found with email: ${validatedData.userEmail}`
          );
        }

        // Find purchase by date
        const purchase = await prisma.tokenPurchase.findFirst({
          where: {
            purchaseDate: new Date(validatedData.purchaseDate),
          },
        });

        if (!purchase) {
          throw new Error(
            `Purchase not found for date: ${validatedData.purchaseDate}`
          );
        }

        // Check for existing contribution
        const existingContribution = await prisma.userContribution.findUnique({
          where: {
            purchaseId_userId: {
              purchaseId: purchase.id,
              userId: user.id,
            },
          },
        });

        if (existingContribution) {
          // Update existing contribution
          await prisma.userContribution.update({
            where: { id: existingContribution.id },
            data: {
              meterReading: validatedData.meterReading,
              tokensConsumed: validatedData.tokensConsumed,
              contributionAmount: validatedData.contributionAmount,
              updatedAt: new Date(),
            },
          });
          result.updated!++;
        } else {
          // Create new contribution
          await prisma.userContribution.create({
            data: {
              purchaseId: purchase.id,
              userId: user.id,
              meterReading: validatedData.meterReading,
              tokensConsumed: validatedData.tokensConsumed,
              contributionAmount: validatedData.contributionAmount,
            },
          });
          result.created!++;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        row: i + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: row,
      });
    }
  }

  return result;
}

// CSV parsing endpoint
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and admin permissions
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true, requireAdmin: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    if (!['purchases', 'contributions'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid import type' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const parsedData = parseCSV(text);

    if (parsedData.length === 0) {
      return NextResponse.json(
        { message: 'No data found in CSV file' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      preview: parsedData.slice(0, 5), // Return first 5 rows as preview
      totalRows: parsedData.length,
      columns: Object.keys(parsedData[0]),
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return NextResponse.json(
      { message: 'Error parsing CSV file' },
      { status: 500 }
    );
  }
}

function parseCSV(text: string): Record<string, unknown>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
    const row: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      let value: unknown = values[index] || '';

      // Try to convert to appropriate types
      if (typeof value === 'string') {
        if (value === 'true' || value === 'false') {
          value = value === 'true';
        } else if (!isNaN(parseFloat(value)) && value !== '') {
          value = parseFloat(value);
        }
      }

      row[header] = value;
    });

    data.push(row);
  }

  return data;
}
