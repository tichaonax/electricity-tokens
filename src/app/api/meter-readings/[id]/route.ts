import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkPermissions } from '@/lib/validation-middleware';

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
      { canAddMeterReadings: true },
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
      { canAddMeterReadings: true },
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

    // Non-admin users can only edit their own readings
    if (
      permissionCheck.user!.role !== 'ADMIN' &&
      existingReading.userId !== permissionCheck.user!.id
    ) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

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

      // Validate chronological order - reading must be >= previous reading
      const previousReading = await prisma.meterReading.findFirst({
        where: {
          userId: existingReading.userId,
          readingDate: {
            lt: newDate,
          },
          id: {
            not: params.id, // Exclude current reading
          },
        },
        orderBy: {
          readingDate: 'desc',
        },
      });

      if (previousReading && newReading < previousReading.reading) {
        return NextResponse.json(
          { 
            message: `Reading must be greater than or equal to previous reading (${previousReading.reading.toFixed(2)} on ${previousReading.readingDate.toISOString().split('T')[0]})`,
          },
          { status: 400 }
        );
      }

      // Validate no future readings exist that are less than this reading
      const futureReading = await prisma.meterReading.findFirst({
        where: {
          userId: existingReading.userId,
          readingDate: {
            gt: newDate,
          },
          reading: {
            lt: newReading,
          },
          id: {
            not: params.id, // Exclude current reading
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
    await prisma.auditLog.create({
      data: {
        userId: permissionCheck.user!.id,
        action: 'UPDATE',
        entityType: 'MeterReading',
        entityId: updatedReading.id,
        oldValues: existingReading,
        newValues: updatedReading,
      },
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
      { canAddMeterReadings: true },
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
    await prisma.auditLog.create({
      data: {
        userId: permissionCheck.user!.id,
        action: 'DELETE',
        entityType: 'MeterReading',
        entityId: existingReading.id,
        oldValues: existingReading,
      },
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