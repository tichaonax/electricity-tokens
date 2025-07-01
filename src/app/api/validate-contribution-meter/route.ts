import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateContributionMeterReading } from '@/lib/meter-reading-validation';
import { z } from 'zod';

const validateContributionMeterSchema = z.object({
  meterReading: z.number().min(0, 'Meter reading must be non-negative'),
  purchaseId: z.string().cuid('Invalid purchase ID'),
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
    const validation = validateContributionMeterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          message: 'Invalid request data',
          errors: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { meterReading, purchaseId } = validation.data;

    // Validate contribution meter reading
    const result = await validateContributionMeterReading(meterReading, purchaseId);

    return NextResponse.json({
      valid: result.valid,
      error: result.error,
      suggestedMinimum: result.suggestedMinimum,
      lastReading: result.lastReading,
    });

  } catch (error) {
    console.error('Error validating contribution meter reading:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}