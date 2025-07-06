import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkPermissions } from '@/lib/validation-middleware';

const validateMeterReadingSchema = z.object({
  reading: z.number().min(0, 'Reading must be non-negative'),
  readingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  statistics?: {
    dailyConsumption: number;
    historicalAverage: number;
    historicalMax: number;
    historicalMin: number;
    threshold: number;
    daysBetween: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and permissions
    const permissionCheck = checkPermissions(
      session,
      { canAddMeterReadings: true },
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateMeterReadingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { reading, readingDate } = validation.data;
    const userId = permissionCheck.user!.id;

    // Convert readingDate to Date object (start of day in UTC)
    const dateObj = new Date(readingDate + 'T00:00:00.000Z');

    const result: ValidationResult = {
      valid: true,
      warnings: [],
      errors: [],
    };

    // Check for existing reading on the same date
    const existingReading = await prisma.meterReading.findFirst({
      where: {
        userId,
        readingDate: dateObj,
      },
    });

    if (existingReading) {
      result.valid = false;
      result.errors.push('A meter reading already exists for this date');
      return NextResponse.json(result);
    }

    // Get previous reading for chronological validation
    const previousReading = await prisma.meterReading.findFirst({
      where: {
        userId,
        readingDate: {
          lt: dateObj,
        },
      },
      orderBy: {
        readingDate: 'desc',
      },
    });

    // Basic chronological validation
    if (previousReading && reading < previousReading.reading) {
      result.valid = false;
      result.errors.push(
        `Reading must be greater than or equal to previous reading (${previousReading.reading.toFixed(2)} on ${previousReading.readingDate.toISOString().split('T')[0]})`
      );
      return NextResponse.json(result);
    }

    // Check future readings
    const futureReading = await prisma.meterReading.findFirst({
      where: {
        userId,
        readingDate: {
          gt: dateObj,
        },
        reading: {
          lt: reading,
        },
      },
      orderBy: {
        readingDate: 'asc',
      },
    });

    if (futureReading) {
      result.valid = false;
      result.errors.push(
        `Reading cannot be greater than future reading (${futureReading.reading.toFixed(2)} on ${futureReading.readingDate.toISOString().split('T')[0]})`
      );
      return NextResponse.json(result);
    }

    // Historical consumption validation
    if (previousReading) {
      const currentConsumption = reading - previousReading.reading;
      const daysBetween = Math.ceil((dateObj.getTime() - previousReading.readingDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyConsumption = daysBetween > 0 ? currentConsumption / daysBetween : currentConsumption;

      // Get historical consumption data for validation
      const historicalReadings = await prisma.meterReading.findMany({
        where: {
          userId,
          readingDate: {
            lt: dateObj,
          },
        },
        orderBy: {
          readingDate: 'desc',
        },
        take: 30, // Last 30 readings for analysis
      });

      if (historicalReadings.length >= 2) {
        // Calculate historical daily consumption patterns
        const historicalConsumptions: number[] = [];
        for (let i = 0; i < historicalReadings.length - 1; i++) {
          const current = historicalReadings[i];
          const previous = historicalReadings[i + 1];
          const consumption = current.reading - previous.reading;
          const days = Math.ceil((current.readingDate.getTime() - previous.readingDate.getTime()) / (1000 * 60 * 60 * 24));
          const dailyConsumptionHist = days > 0 ? consumption / days : consumption;
          if (dailyConsumptionHist >= 0) {
            historicalConsumptions.push(dailyConsumptionHist);
          }
        }

        if (historicalConsumptions.length > 0) {
          // Calculate statistical measures
          const avg = historicalConsumptions.reduce((sum, val) => sum + val, 0) / historicalConsumptions.length;
          const max = Math.max(...historicalConsumptions);
          const min = Math.min(...historicalConsumptions);
          const sortedConsumptions = [...historicalConsumptions].sort((a, b) => a - b);
          
          // Calculate median
          const mid = Math.floor(sortedConsumptions.length / 2);
          const median = sortedConsumptions.length % 2 === 0 
            ? (sortedConsumptions[mid - 1] + sortedConsumptions[mid]) / 2
            : sortedConsumptions[mid];

          // Define validation thresholds
          const maxReasonableDaily = Math.max(avg * 3, median * 4, max * 1.5, 50); // Allow up to 3x average, 4x median, 1.5x historical max, or 50 kWh minimum
          const minReasonableDaily = Math.max(0, avg * 0.1); // Minimum 10% of average (but not negative)

          result.statistics = {
            dailyConsumption,
            historicalAverage: avg,
            historicalMax: max,
            historicalMin: min,
            threshold: maxReasonableDaily,
            daysBetween,
          };

          // Validation checks
          if (dailyConsumption > maxReasonableDaily) {
            result.valid = false;
            result.errors.push(
              `Daily consumption of ${dailyConsumption.toFixed(2)} kWh seems unusually high. Your historical average is ${avg.toFixed(2)} kWh/day and maximum was ${max.toFixed(2)} kWh/day. Please verify the reading.`
            );
          } else if (dailyConsumption > avg * 2) {
            result.warnings.push(
              `Daily consumption of ${dailyConsumption.toFixed(2)} kWh is significantly higher than your average of ${avg.toFixed(2)} kWh/day.`
            );
          }

          if (dailyConsumption < minReasonableDaily && currentConsumption > 0) {
            result.warnings.push(
              `Daily consumption of ${dailyConsumption.toFixed(2)} kWh is unusually low compared to your average of ${avg.toFixed(2)} kWh/day.`
            );
          }

          // Check for zero consumption over multiple days
          if (currentConsumption === 0 && daysBetween > 1) {
            result.warnings.push(
              `Zero consumption over ${daysBetween} days is unusual. Please verify the reading.`
            );
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating meter reading:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}