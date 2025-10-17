import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BackupService } from '@/lib/backup';
import { ErrorReporter } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type = 'full', sinceDate } = body;

    let backupData;

    if (type === 'incremental') {
      if (!sinceDate) {
        return NextResponse.json(
          { error: 'sinceDate is required for incremental backups' },
          { status: 400 }
        );
      }

      const since = new Date(sinceDate);
      if (isNaN(since.getTime())) {
        return NextResponse.json(
          { error: 'Invalid sinceDate format' },
          { status: 400 }
        );
      }

      backupData = await BackupService.createIncrementalBackup(
        session.user.id,
        since
      );
    } else {
      backupData = await BackupService.createFullBackup(session.user.id);
    }

    // Return backup data with proper headers for download
    const response = NextResponse.json(backupData);
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="ElectricityTracker-backup_${backupData.metadata.id}.json"`
    );
    response.headers.set('Content-Type', 'application/json');

    return response;
  } catch (error) {
    console.error('Backup creation failed:', error);

    ErrorReporter.reportApiError(
      error instanceof Error ? error : new Error('Backup creation failed'),
      { method: 'POST', url: '/api/admin/backup' }
    );

    return NextResponse.json(
      {
        error: 'Backup creation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get backup recommendations
    const recommendations = await BackupService.getBackupRecommendations();

    return NextResponse.json({
      recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get backup recommendations:', error);

    ErrorReporter.reportApiError(
      error instanceof Error
        ? error
        : new Error('Failed to get backup recommendations'),
      { method: 'GET', url: '/api/admin/backup' }
    );

    return NextResponse.json(
      {
        error: 'Failed to get backup recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
