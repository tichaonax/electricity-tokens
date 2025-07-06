import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hasPermission, mergeWithDefaultPermissions, ADMIN_PERMISSIONS } from '@/types/permissions';

// Validation schemas
const createMeterReadingSchema = z.object({
  reading: z.number().min(0, 'Reading must be non-negative'),
  readingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().optional(),
});

const queryMeterReadingsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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

    // Non-admin users can only see their own readings
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id;
    } else if (userId) {
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
        orderBy: { readingDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.meterReading.count({ where }),
    ]);

    return NextResponse.json({
      meterReadings,
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

    // Convert readingDate to Date object (start of day in UTC)
    const dateObj = new Date(readingDate + 'T00:00:00.000Z');

    // Validate chronological order - reading must be >= most recent reading
    // For same-day readings, also check against readings from the same day
    const mostRecentReading = await prisma.meterReading.findFirst({
      where: {
        userId,
        OR: [
          {
            readingDate: {
              lt: dateObj,
            },
          },
          {
            readingDate: dateObj,
            reading: {
              lte: reading, // Allow equal or higher readings on the same day
            },
          },
        ],
      },
      orderBy: [
        { readingDate: 'desc' },
        { reading: 'desc' }, // Highest reading for the same day
      ],
    });

    if (mostRecentReading && reading < mostRecentReading.reading) {
      return NextResponse.json(
        { 
          message: `Reading must be greater than or equal to most recent reading (${mostRecentReading.reading.toFixed(2)} on ${mostRecentReading.readingDate.toISOString().split('T')[0]})`,
        },
        { status: 400 }
      );
    }

    // Historical consumption validation (only for different days)
    if (mostRecentReading && mostRecentReading.readingDate.getTime() !== dateObj.getTime()) {
      const currentConsumption = reading - mostRecentReading.reading;
      const daysBetween = Math.ceil((dateObj.getTime() - mostRecentReading.readingDate.getTime()) / (1000 * 60 * 60 * 24));
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

    // Validate no future readings exist that are less than this reading
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
      return NextResponse.json(
        { 
          message: `Reading cannot be greater than future reading (${futureReading.reading.toFixed(2)} on ${futureReading.readingDate.toISOString().split('T')[0]})`,
        },
        { status: 400 }
      );
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
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'MeterReading',
        entityId: meterReading.id,
        newValues: meterReading,
      },
    });

    return NextResponse.json(meterReading, { status: 201 });
  } catch (error) {
    console.error('Error creating meter reading:', error);

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}