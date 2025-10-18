import { prisma } from './prisma';
import crypto from 'crypto';

/**
 * Generate a CUID for database records
 */
function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomPart}${randomPart2}`;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'SESSION_CREATED' | 'SESSION_DESTROYED' | 'PERMISSION_CHANGED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED';

export type AuditEntityType = 'User' | 'TokenPurchase' | 'UserContribution' | 'MeterReading' | 'Session' | 'Authentication' | 'Permission' | 'SystemConfig';

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Generate a hash for audit log integrity verification
 */
function generateAuditHash(entry: AuditLogEntry, timestamp: Date): string {
  const data = JSON.stringify({
    ...entry,
    timestamp: timestamp.toISOString(),
  });
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create an audit log entry with integrity verification
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const timestamp = new Date();
    const hash = generateAuditHash(entry, timestamp);

    await prisma.auditLog.create({
      data: {
        id: generateCuid(),
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues || null,
        newValues: entry.newValues || null,
        timestamp,
        metadata: {
          ...entry.metadata,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          hash,
        },
      },
    });
  } catch (error) {
    // Log error but don't throw to avoid breaking main operations
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Audit helper for CREATE operations
 */
export async function auditCreate(
  context: AuditContext,
  entityType: AuditEntityType,
  entityId: string,
  newValues: Record<string, any>,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId: context.userId,
    action: 'CREATE',
    entityType,
    entityId,
    newValues,
    metadata,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
}

/**
 * Audit helper for UPDATE operations
 */
export async function auditUpdate(
  context: AuditContext,
  entityType: AuditEntityType,
  entityId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId: context.userId,
    action: 'UPDATE',
    entityType,
    entityId,
    oldValues,
    newValues,
    metadata,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
}

/**
 * Audit helper for DELETE operations
 */
export async function auditDelete(
  context: AuditContext,
  entityType: AuditEntityType,
  entityId: string,
  oldValues: Record<string, any>,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId: context.userId,
    action: 'DELETE',
    entityType,
    entityId,
    oldValues,
    metadata,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
}

/**
 * Audit helper for authentication events
 */
export async function auditAuthentication(
  userId: string,
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED',
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType: 'Authentication',
    entityId: userId,
    metadata,
    ipAddress,
    userAgent,
  });
}

/**
 * Audit helper for session events
 */
export async function auditSession(
  userId: string,
  action: 'SESSION_CREATED' | 'SESSION_DESTROYED',
  sessionId: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType: 'Session',
    entityId: sessionId,
    metadata,
    ipAddress,
    userAgent,
  });
}

/**
 * Audit helper for permission changes
 */
export async function auditPermissionChange(
  context: AuditContext,
  targetUserId: string,
  oldPermissions: Record<string, any>,
  newPermissions: Record<string, any>,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId: context.userId,
    action: 'PERMISSION_CHANGED',
    entityType: 'Permission',
    entityId: targetUserId,
    oldValues: oldPermissions,
    newValues: newPermissions,
    metadata,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
}

/**
 * Audit helper for account locking/unlocking
 */
export async function auditAccountLockChange(
  context: AuditContext,
  targetUserId: string,
  isLocked: boolean,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId: context.userId,
    action: isLocked ? 'ACCOUNT_LOCKED' : 'ACCOUNT_UNLOCKED',
    entityType: 'User',
    entityId: targetUserId,
    newValues: { locked: isLocked },
    metadata,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
}

/**
 * Get audit trail for a specific entity
 */
export async function getEntityAuditTrail(
  entityType: AuditEntityType,
  entityId: string,
  limit: number = 50
) {
  return await prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
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
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });
}

/**
 * Verify audit log integrity
 */
export async function verifyAuditLogIntegrity(auditLogId: string): Promise<boolean> {
  const auditLog = await prisma.auditLog.findUnique({
    where: { id: auditLogId },
  });

  if (!auditLog) {
    return false;
  }

  // Extract stored hash from metadata
  const storedHash = auditLog.metadata?.hash;
  if (!storedHash) {
    return false; // Old entries without hash
  }

  // Recreate the entry data for hash verification
  const entryData: AuditLogEntry = {
    userId: auditLog.userId,
    action: auditLog.action as AuditAction,
    entityType: auditLog.entityType as AuditEntityType,
    entityId: auditLog.entityId,
    oldValues: auditLog.oldValues as Record<string, any> || undefined,
    newValues: auditLog.newValues as Record<string, any> || undefined,
    metadata: {
      ...auditLog.metadata,
      ipAddress: auditLog.metadata?.ipAddress,
      userAgent: auditLog.metadata?.userAgent,
    },
  };

  // Generate hash and compare
  const computedHash = generateAuditHash(entryData, auditLog.timestamp);
  return computedHash === storedHash;
}

/**
 * Detect suspicious audit patterns
 */
export async function detectSuspiciousActivity(timeWindowHours: number = 24): Promise<{
  multipleFailedLogins: any[];
  bulkOperations: any[];
  unusualPermissionChanges: any[];
}> {
  const timeThreshold = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

  // Multiple failed logins from same IP
  const multipleFailedLogins = await prisma.$queryRaw`
    SELECT 
      JSON_EXTRACT(metadata, '$.ipAddress') as ipAddress,
      COUNT(*) as failedAttempts,
      MAX(timestamp) as lastAttempt
    FROM audit_logs 
    WHERE action = 'LOGIN_FAILED' 
      AND timestamp > ${timeThreshold}
      AND JSON_EXTRACT(metadata, '$.ipAddress') IS NOT NULL
    GROUP BY JSON_EXTRACT(metadata, '$.ipAddress')
    HAVING COUNT(*) >= 5
    ORDER BY failedAttempts DESC
  `;

  // Bulk operations (many actions by same user in short time)
  const bulkOperations = await prisma.$queryRaw`
    SELECT 
      userId,
      action,
      entityType,
      COUNT(*) as actionCount,
      MIN(timestamp) as firstAction,
      MAX(timestamp) as lastAction
    FROM audit_logs 
    WHERE timestamp > ${timeThreshold}
      AND action IN ('CREATE', 'UPDATE', 'DELETE')
    GROUP BY userId, action, entityType
    HAVING COUNT(*) >= 10
    ORDER BY actionCount DESC
  `;

  // Unusual permission changes (multiple permission changes)
  const unusualPermissionChanges = await prisma.auditLog.findMany({
    where: {
      action: 'PERMISSION_CHANGED',
      timestamp: {
        gt: timeThreshold,
      },
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
    orderBy: {
      timestamp: 'desc',
    },
  });

  return {
    multipleFailedLogins,
    bulkOperations,
    unusualPermissionChanges,
  };
}

/**
 * Get audit statistics for dashboard
 */
export async function getAuditStatistics(days: number = 30) {
  const timeThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stats = await prisma.auditLog.groupBy({
    by: ['action'],
    where: {
      timestamp: {
        gt: timeThreshold,
      },
    },
    _count: {
      action: true,
    },
    orderBy: {
      _count: {
        action: 'desc',
      },
    },
  });

  const totalLogs = await prisma.auditLog.count({
    where: {
      timestamp: {
        gt: timeThreshold,
      },
    },
  });

  const uniqueUsers = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: {
      timestamp: {
        gt: timeThreshold,
      },
    },
    _count: {
      userId: true,
    },
  });

  return {
    totalLogs,
    uniqueUsers: uniqueUsers.length,
    actionBreakdown: stats,
  };
}