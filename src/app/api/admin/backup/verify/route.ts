import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BackupService, BackupData } from '@/lib/backup';
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

    const backupData: BackupData = await request.json();

    // Validate backup data structure
    if (!backupData.metadata || !backupData.data) {
      return NextResponse.json(
        { error: 'Invalid backup data structure' },
        { status: 400 }
      );
    }

    // Verify backup integrity
    const verification = await BackupService.verifyBackup(backupData);

    return NextResponse.json({
      ...verification,
      backupId: backupData.metadata.id,
      backupType: backupData.metadata.type,
      backupTimestamp: backupData.metadata.timestamp,
      recordCounts: backupData.metadata.recordCounts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Backup verification failed:', error);

    ErrorReporter.reportApiError(
      error instanceof Error ? error : new Error('Backup verification failed'),
      { method: 'POST', url: '/api/admin/backup/verify' }
    );

    return NextResponse.json(
      {
        error: 'Backup verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
