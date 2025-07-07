import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkPermissions } from '@/lib/validation-middleware';
import { createAuditLog } from '@/lib/audit';

// Validation schema for updates
const updateMeterReadingSchema = z.object({
  reading: z.number().min(0, 'Reading must be non-negative').optional(),
  readingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    const meterReading = await prisma.meterReading.findUnique({
      where: { id: params.id },
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

    if (!meterReading) {
      return NextResponse.json(
        { message: 'Meter reading not found' },
        { status: 404 }
      );
    }

    // Non-admin users can only see their own readings
    if (
      permissionCheck.user!.role !== 'ADMIN' &&
      meterReading.userId !== permissionCheck.user!.id
    ) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(meterReading);
  } catch (error) {
    console.error('Error fetching meter reading:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and permissions
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Check if meter reading exists
    const existingReading = await prisma.meterReading.findUnique({
      where: { id: params.id },
    });

    if (!existingReading) {
      return NextResponse.json(
        { message: 'Meter reading not found' },
        { status: 404 }
      );
    }

    // Allow all users with meter reading permissions to edit any reading (shared electricity system)
    // Permission is already checked by checkPermissions above

    // Parse and validate request body
    const body = await request.json();
    const validation = updateMeterReadingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // If updating reading or date, validate chronological constraints
    if (updateData.reading !== undefined || updateData.readingDate !== undefined) {
      const newReading = updateData.reading ?? existingReading.reading;
      const newDate = updateData.readingDate 
        ? new Date(updateData.readingDate + 'T00:00:00.000Z')
        : existingReading.readingDate;

      // Comprehensive chronological validation for updates
      
      // Step 1: Get the maximum reading on the same date (excluding current reading) - GLOBAL
      const maxReadingOnSameDate = await prisma.meterReading.findFirst({
        where: {
          readingDate: newDate,
          id: {
            not: params.id, // Exclude current reading
          },
        },
        orderBy: {
          reading: 'desc',
        },
      });

      // Step 2: Get the most recent reading before this date - GLOBAL
      const mostRecentBeforeDate = await prisma.meterReading.findFirst({
        where: {
          readingDate: {
            lt: newDate,
          },
          id: {
            not: params.id, // Exclude current reading
          },
        },
        orderBy: [
          { readingDate: 'desc' },
          { reading: 'desc' },
        ],
      });

      // Step 3: Get the earliest reading after this date - GLOBAL
      const earliestAfterDate = await prisma.meterReading.findFirst({
        where: {
          readingDate: {
            gt: newDate,
          },
          id: {
            not: params.id, // Exclude current reading
          },
        },
        orderBy: [
          { readingDate: 'asc' },
          { reading: 'asc' },
        ],
      });

      // Validation Rule 1: Must be >= maximum reading on the same date
      if (maxReadingOnSameDate && newReading < maxReadingOnSameDate.reading) {
        return NextResponse.json(
          { 
            message: `Reading must be greater than or equal to the highest reading on the same date (${maxReadingOnSameDate.reading.toFixed(2)})`,
          },
          { status: 400 }
        );
      }

      // Validation Rule 2: Must be >= most recent reading before this date
      if (mostRecentBeforeDate && newReading < mostRecentBeforeDate.reading) {
        return NextResponse.json(
          { 
            message: `Reading must be greater than or equal to the most recent reading (${mostRecentBeforeDate.reading.toFixed(2)} on ${mostRecentBeforeDate.readingDate.toISOString().split('T')[0]})`,
          },
          { status: 400 }
        );
      }

      // Validation Rule 3: Must be <= earliest reading after this date
      if (earliestAfterDate && newReading > earliestAfterDate.reading) {
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
              purchaseDate: { lte: newDate },
            },
            _sum: {
              totalTokens: true,
            },
          });

          const maxAllowedReading = firstPurchase.meterReading + (totalTokensPurchased._sum.totalTokens || 0);
          
          if (newReading > maxAllowedReading) {
            return NextResponse.json(
              { 
                message: `Meter reading cannot exceed ${maxAllowedReading.toFixed(2)} kWh (initial reading ${firstPurchase.meterReading.toFixed(2)} + total tokens purchased ${(totalTokensPurchased._sum.totalTokens || 0).toFixed(2)})`,
              },
              { status: 400 }
            );
          }
        }
      } catch (maxReadingError) {
        console.error('Error validating maximum meter reading:', maxReadingError);
        // Don't block the operation if this validation fails - log and continue
      }
    }

    // Prepare update data
    const dataToUpdate: any = {};
    if (updateData.reading !== undefined) {
      dataToUpdate.reading = updateData.reading;
    }
    if (updateData.readingDate !== undefined) {
      dataToUpdate.readingDate = new Date(updateData.readingDate + 'T00:00:00.000Z');
    }
    if (updateData.notes !== undefined) {
      dataToUpdate.notes = updateData.notes || null;
    }

    // Update meter reading
    const updatedReading = await prisma.meterReading.update({
      where: { id: params.id },
      data: dataToUpdate,
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
      userId: permissionCheck.user!.id,
      action: 'UPDATE',
      entityType: 'MeterReading',
      entityId: updatedReading.id,
      oldValues: existingReading,
      newValues: updatedReading,
    });

    return NextResponse.json(updatedReading);
  } catch (error) {
    console.error('Error updating meter reading:', error);
    
    // Handle unique constraint violation (duplicate date for user)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { message: 'A meter reading already exists for this date' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and permissions
    const permissionCheck = checkPermissions(
      session,
      {},
      { requireAuth: true }
    );
    if (!permissionCheck.success) {
      return NextResponse.json(
        { message: permissionCheck.error },
        { status: 401 }
      );
    }

    // Check if meter reading exists
    const existingReading = await prisma.meterReading.findUnique({
      where: { id: params.id },
    });

    if (!existingReading) {
      return NextResponse.json(
        { message: 'Meter reading not found' },
        { status: 404 }
      );
    }

    // Non-admin users can only delete their own readings
    if (
      permissionCheck.user!.role !== 'ADMIN' &&
      existingReading.userId !== permissionCheck.user!.id
    ) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete meter reading
    await prisma.meterReading.delete({
      where: { id: params.id },
    });

    // Create audit log entry
    await createAuditLog({
      userId: permissionCheck.user!.id,
      action: 'DELETE',
      entityType: 'MeterReading',
      entityId: existingReading.id,
      oldValues: existingReading,
    });

    return NextResponse.json(
      { message: 'Meter reading deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting meter reading:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}