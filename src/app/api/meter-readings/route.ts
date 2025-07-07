import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission, mergeWithDefaultPermissions, ADMIN_PERMISSIONS } from '@/types/permissions';
import { createAuditLog } from '@/lib/audit';

// Validation schemas
const createMeterReadingSchema = z.object({
  reading: z.number().min(0, 'Reading must be non-negative'),
  readingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().optional(),
});

const queryMeterReadingsSchema = z.object({
  page: z.string().nullable().transform(val => val ? Number(val) : 1).pipe(z.number().min(1)),
  limit: z.string().nullable().transform(val => val ? Number(val) : 10).pipe(z.number().min(1).max(100)),
  userId: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // For reading meter readings, allow all authenticated users to view their own data
    // No additional permission check needed for GET operations

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryData = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      userId: searchParams.get('userId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    };

    const validation = queryMeterReadingsSchema.safeParse(queryData);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, userId, startDate, endDate } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Allow all users to see all meter readings (shared electricity system)
    // Only apply userId filter if specifically requested via query parameter
    if (userId) {
      where.userId = userId;
    }

    // Date filtering
    if (startDate || endDate) {
      where.readingDate = {};
      if (startDate) {
        where.readingDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.readingDate.lte = new Date(endDate);
      }
    }

    const [meterReadings, total] = await Promise.all([
      prisma.meterReading.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { readingDate: 'desc' },
          { createdAt: 'desc' } // Secondary sort by creation time for same-date readings
        ],
        skip,
        take: limit,
      }),
      prisma.meterReading.count({ where }),
    ]);

    // Get audit information for each meter reading
    const meterReadingsWithAudit = await Promise.all(
      meterReadings.map(async (reading) => {
        // Get the most recent UPDATE audit log for this meter reading
        const latestUpdateAudit = await prisma.auditLog.findFirst({
          where: {
            entityType: 'MeterReading',
            entityId: reading.id,
            action: 'UPDATE',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
        });

        return {
          ...reading,
          latestUpdateAudit,
        };
      })
    );


    return NextResponse.json({
      meterReadings: meterReadingsWithAudit,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching meter readings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
    const userPermissions = session.user.role === 'ADMIN' 
      ? ADMIN_PERMISSIONS 
      : mergeWithDefaultPermissions(session.user.permissions || {});
    
    if (!hasPermission(userPermissions, 'canAddMeterReadings')) {
      return NextResponse.json(
        { message: 'Permission denied' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createMeterReadingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { reading, readingDate, notes } = validation.data;
    const userId = session.user.id;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'User ID not found in session' },
        { status: 401 }
      );
    }

    // Convert readingDate to Date object (start of day in UTC)
    const dateObj = new Date(readingDate + 'T00:00:00.000Z');

    // Comprehensive chronological validation
    
    // Step 1: Get the maximum reading on the same date (if any) - GLOBAL across all users
    const maxReadingOnSameDate = await prisma.meterReading.findFirst({
      where: {
        readingDate: dateObj,
      },
      orderBy: {
        reading: 'desc',
      },
    });

    // Step 2: Get the most recent reading before this date - GLOBAL across all users
    const mostRecentBeforeDate = await prisma.meterReading.findFirst({
      where: {
        readingDate: {
          lt: dateObj,
        },
      },
      orderBy: [
        { readingDate: 'desc' },
        { reading: 'desc' },
      ],
    });

    // Step 3: Get the earliest reading after this date - GLOBAL across all users
    const earliestAfterDate = await prisma.meterReading.findFirst({
      where: {
        readingDate: {
          gt: dateObj,
        },
      },
      orderBy: [
        { readingDate: 'asc' },
        { reading: 'asc' },
      ],
    });

    // Validation Rule 1: Must be >= maximum reading on the same date
    if (maxReadingOnSameDate && reading < maxReadingOnSameDate.reading) {
      return NextResponse.json(
        { 
          message: `Reading must be greater than or equal to the highest reading on the same date (${maxReadingOnSameDate.reading.toFixed(2)})`,
        },
        { status: 400 }
      );
    }

    // Validation Rule 2: Must be >= most recent reading before this date
    if (mostRecentBeforeDate && reading < mostRecentBeforeDate.reading) {
      return NextResponse.json(
        { 
          message: `Reading must be greater than or equal to the most recent reading (${mostRecentBeforeDate.reading.toFixed(2)} on ${mostRecentBeforeDate.readingDate.toISOString().split('T')[0]})`,
        },
        { status: 400 }
      );
    }

    // Validation Rule 3: Must be <= earliest reading after this date
    if (earliestAfterDate && reading > earliestAfterDate.reading) {
      return NextResponse.json(
        { 
          message: `Reading cannot be greater than the next chronological reading (${earliestAfterDate.reading.toFixed(2)} on ${earliestAfterDate.readingDate.toISOString().split('T')[0]}). Meter readings must increase chronologically.`,
        },
        { status: 400 }
      );
    }

    // Validate maximum meter reading constraint: 
    // Reading cannot exceed initial meter reading + total tokens purchased to date
    try {
      const firstPurchase = await prisma.tokenPurchase.findFirst({
        orderBy: { purchaseDate: 'asc' },
      });

      if (firstPurchase) {
        // Calculate total tokens purchased to date (up to the meter reading date)
        const totalTokensPurchased = await prisma.tokenPurchase.aggregate({
          where: {
            purchaseDate: { lte: dateObj },
          },
          _sum: {
            totalTokens: true,
          },
        });

        const maxAllowedReading = firstPurchase.meterReading + (totalTokensPurchased._sum.totalTokens || 0);
        
        if (reading > maxAllowedReading) {
          return NextResponse.json(
            { 
              message: `Meter reading cannot exceed ${maxAllowedReading.toFixed(2)} kWh (initial reading ${firstPurchase.meterReading.toFixed(2)} + total tokens purchased ${(totalTokensPurchased._sum.totalTokens || 0).toFixed(2)})`,
            },
            { status: 400 }
          );
        }
      } else {
        // If no purchases exist, meter readings cannot be created
        // The constraint requires: reading ≤ initial_meter_reading + total_tokens
        // Without purchases, there's no valid constraint to check against
        return NextResponse.json(
          { 
            message: 'No token purchases found. Please create a token purchase first to establish the initial meter reading and constraints.',
          },
          { status: 400 }
        );
      }
    } catch (maxReadingError) {
      console.error('Error validating maximum meter reading:', maxReadingError);
      // Don't block the operation if this validation fails - log and continue
    }

    // Historical consumption validation (only for different days)
    if (mostRecentBeforeDate && mostRecentBeforeDate.readingDate.getTime() !== dateObj.getTime()) {
      const currentConsumption = reading - mostRecentBeforeDate.reading;
      const daysBetween = Math.ceil((dateObj.getTime() - mostRecentBeforeDate.readingDate.getTime()) / (1000 * 60 * 60 * 24));
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
          const sortedConsumptions = [...historicalConsumptions].sort((a, b) => a - b);
          const max = Math.max(...historicalConsumptions);
          
          // Calculate median
          const mid = Math.floor(sortedConsumptions.length / 2);
          const median = sortedConsumptions.length % 2 === 0 
            ? (sortedConsumptions[mid - 1] + sortedConsumptions[mid]) / 2
            : sortedConsumptions[mid];

          // Define validation thresholds
          const maxReasonableDaily = Math.max(avg * 3, median * 4, max * 1.5, 50); // Allow up to 3x average, 4x median, 1.5x historical max, or 50 kWh minimum
          const minReasonableDaily = Math.max(0, avg * 0.1); // Minimum 10% of average (but not negative)

          // Validation warnings and errors
          const warnings: string[] = [];
          let isError = false;

          if (dailyConsumption > maxReasonableDaily) {
            isError = true;
            return NextResponse.json(
              { 
                message: `Daily consumption of ${dailyConsumption.toFixed(2)} kWh seems unusually high. Your historical average is ${avg.toFixed(2)} kWh/day and maximum was ${max.toFixed(2)} kWh/day. Please verify the reading.`,
                details: {
                  currentConsumption,
                  dailyConsumption,
                  daysBetween,
                  historicalAverage: avg,
                  historicalMax: max,
                  threshold: maxReasonableDaily
                }
              },
              { status: 400 }
            );
          }

          if (dailyConsumption > avg * 2) {
            warnings.push(`Daily consumption of ${dailyConsumption.toFixed(2)} kWh is significantly higher than your average of ${avg.toFixed(2)} kWh/day.`);
          }

          if (dailyConsumption < minReasonableDaily && currentConsumption > 0) {
            warnings.push(`Daily consumption of ${dailyConsumption.toFixed(2)} kWh is unusually low compared to your average of ${avg.toFixed(2)} kWh/day.`);
          }

          // Store warnings for later use (could be returned with success response)
          if (warnings.length > 0) {
            // For now, we'll just log the warnings - could be enhanced to return them
            console.log('Meter reading warnings:', warnings);
          }
        }
      }
    }


    // Create meter reading
    const meterReading = await prisma.meterReading.create({
      data: {
        userId,
        reading,
        readingDate: dateObj,
        notes: notes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log entry
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'MeterReading',
      entityId: meterReading.id,
      newValues: meterReading,
    });

    return NextResponse.json(meterReading, { status: 201 });
  } catch (error) {
    console.error('Error creating meter reading:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });

    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}