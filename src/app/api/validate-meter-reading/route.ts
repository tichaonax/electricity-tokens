import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  validateMeterReadingChronology, 
  getMeterReadingSuggestion 
} from '@/lib/meter-reading-validation';
import { z } from 'zod';

const validateMeterReadingSchema = z.object({
  meterReading: z.number().min(0, 'Meter reading must be non-negative'),
  purchaseDate: z.string().datetime('Invalid purchase date format'),
  type: z.enum(['purchase', 'contribution']),
  excludePurchaseId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateMeterReadingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          message: 'Invalid request data',
          errors: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { meterReading, purchaseDate, type, excludePurchaseId } = validation.data;
    const date = new Date(purchaseDate);

    // Validate meter reading chronology
    const result = await validateMeterReadingChronology(
      meterReading,
      date,
      type,
      excludePurchaseId
    );

    // Get suggestion information
    const suggestion = await getMeterReadingSuggestion(date, excludePurchaseId);

    return NextResponse.json({
      valid: result.valid,
      error: result.error,
      suggestedMinimum: result.suggestedMinimum,
      lastReading: result.lastReading,
      suggestion: suggestion.suggestion,
      minimum: suggestion.minimum,
      context: suggestion.context,
    });

  } catch (error) {
    console.error('Error validating meter reading:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}