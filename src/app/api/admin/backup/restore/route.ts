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

    const body = await request.json();
    const {
      backupData,
      options = {},
    }: { backupData: BackupData; options: Record<string, unknown> } = body;

    // Validate backup data structure
    if (!backupData?.metadata || !backupData?.data) {
      return NextResponse.json(
        { error: 'Invalid backup data structure' },
        { status: 400 }
      );
    }

    // Always start with dry run for safety
    const dryRunOptions = { ...options, dryRun: true };
    const dryRunResult = await BackupService.restoreFromBackup(
      backupData,
      session.user.id,
      dryRunOptions
    );

    if (!dryRunResult.success) {
      return NextResponse.json(
        {
          error: 'Dry run failed - restore cannot proceed',
          errors: dryRunResult.errors,
          dryRun: true,
        },
        { status: 400 }
      );
    }

    // If explicitly requested to proceed with actual restore
    if (options.proceedWithRestore === true) {
      console.warn('PROCEEDING WITH ACTUAL RESTORE - MODIFYING DATABASE');

      const restoreResult = await BackupService.restoreFromBackup(
        backupData,
        session.user.id,
        { ...options, dryRun: false }
      );

      return NextResponse.json({
        ...restoreResult,
        backupId: backupData.metadata.id,
        backupType: backupData.metadata.type,
        actualRestore: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Return dry run results by default
    return NextResponse.json({
      ...dryRunResult,
      backupId: backupData.metadata.id,
      backupType: backupData.metadata.type,
      dryRun: true,
      message:
        'Dry run completed successfully. Set proceedWithRestore: true to perform actual restore.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Backup restore failed:', error);

    ErrorReporter.reportApiError(
      error instanceof Error ? error : new Error('Backup restore failed'),
      { method: 'POST', url: '/api/admin/backup/restore' }
    );

    return NextResponse.json(
      {
        error: 'Backup restore failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
