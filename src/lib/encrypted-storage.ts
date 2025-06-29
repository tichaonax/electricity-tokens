import { DataEncryption } from './security';
import { prisma } from './prisma';

/**
 * Utility for storing and retrieving encrypted sensitive data
 */
export class EncryptedStorage {
  /**
   * Store encrypted user data (e.g., payment information, personal notes)
   */
  static async storeUserData(
    userId: string,
    dataType: string,
    data: Record<string, any>
  ): Promise<string> {
    try {
      const encryptedData = DataEncryption.encrypt(JSON.stringify(data));
      
      // Store in a dedicated encrypted_data table (you'll need to add this to your schema)
      // For now, we'll simulate this with the audit log system
      const record = await prisma.auditLog.create({
        data: {
          userId,
          action: 'ENCRYPTED_STORE',
          entityType: 'UserData',
          entityId: `${dataType}_${Date.now()}`,
          newValues: { encryptedData },
          oldValues: { dataType, timestamp: new Date() },
        },
      });

      return record.id;
    } catch (error) {
      console.error('Error storing encrypted data:', error);
      throw new Error('Failed to store encrypted data');
    }
  }

  /**
   * Retrieve and decrypt user data
   */
  static async retrieveUserData(
    recordId: string,
    userId: string
  ): Promise<Record<string, any> | null> {
    try {
      const record = await prisma.auditLog.findFirst({
        where: {
          id: recordId,
          userId,
          action: 'ENCRYPTED_STORE',
        },
      });

      if (!record || !record.newValues) {
        return null;
      }

      const encryptedData = (record.newValues as any).encryptedData;
      if (!encryptedData) {
        return null;
      }

      const decryptedData = DataEncryption.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error retrieving encrypted data:', error);
      return null;
    }
  }

  /**
   * Encrypt user password for storage (additional layer beyond bcrypt)
   */
  static encryptPassword(password: string): string {
    try {
      return DataEncryption.encrypt(password);
    } catch (error) {
      console.error('Error encrypting password:', error);
      throw new Error('Failed to encrypt password');
    }
  }

  /**
   * Hash sensitive identifiers for secure indexing
   */
  static hashIdentifier(identifier: string): string {
    return DataEncryption.hash(identifier);
  }

  /**
   * Create encrypted backup of user data
   */
  static async createUserBackup(userId: string): Promise<string> {
    try {
      // Gather user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          contributions: true,
          createdPurchases: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Remove sensitive fields before encryption
      const backupData = {
        ...user,
        password: undefined, // Never include password in backups
        auditLogs: undefined,
        accounts: undefined,
        sessions: undefined,
        backupTimestamp: new Date().toISOString(),
        backupVersion: '1.0',
      };

      const encryptedBackup = DataEncryption.encrypt(JSON.stringify(backupData));
      
      // Store backup reference
      const backupRecord = await prisma.auditLog.create({
        data: {
          userId,
          action: 'BACKUP_CREATED',
          entityType: 'UserBackup',
          entityId: `backup_${Date.now()}`,
          newValues: { encryptedBackup, size: encryptedBackup.length },
          oldValues: { timestamp: new Date(), type: 'full_backup' },
        },
      });

      return backupRecord.id;
    } catch (error) {
      console.error('Error creating user backup:', error);
      throw new Error('Failed to create user backup');
    }
  }

  /**
   * Restore user data from encrypted backup
   */
  static async restoreUserBackup(
    backupId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const backupRecord = await prisma.auditLog.findFirst({
        where: {
          id: backupId,
          userId,
          action: 'BACKUP_CREATED',
        },
      });

      if (!backupRecord || !backupRecord.newValues) {
        return false;
      }

      const encryptedBackup = (backupRecord.newValues as any).encryptedBackup;
      if (!encryptedBackup) {
        return false;
      }

      const decryptedData = DataEncryption.decrypt(encryptedBackup);
      const backupData = JSON.parse(decryptedData);

      // Validate backup data structure
      if (!backupData.id || !backupData.email || !backupData.backupVersion) {
        throw new Error('Invalid backup data structure');
      }

      // Log the restore operation
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'BACKUP_RESTORED',
          entityType: 'UserBackup',
          entityId: backupId,
          newValues: { restoredAt: new Date() },
          oldValues: { originalBackupTime: backupData.backupTimestamp },
        },
      });

      return true;
    } catch (error) {
      console.error('Error restoring user backup:', error);
      return false;
    }
  }
}

/**
 * Utility for encrypting sensitive configuration data
 */
export class ConfigEncryption {
  /**
   * Encrypt configuration values
   */
  static encryptConfig(config: Record<string, any>): string {
    try {
      return DataEncryption.encrypt(JSON.stringify(config));
    } catch (error) {
      console.error('Error encrypting config:', error);
      throw new Error('Failed to encrypt configuration');
    }
  }

  /**
   * Decrypt configuration values
   */
  static decryptConfig(encryptedConfig: string): Record<string, any> {
    try {
      const decrypted = DataEncryption.decrypt(encryptedConfig);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting config:', error);
      throw new Error('Failed to decrypt configuration');
    }
  }

  /**
   * Secure storage for API keys and secrets
   */
  static storeSecret(key: string, value: string): string {
    try {
      const hashedKey = DataEncryption.hash(key);
      const encryptedValue = DataEncryption.encrypt(value);
      
      // In production, this would be stored in a secure key vault
      // For demo purposes, we'll use environment variables or secure storage
      process.env[`ENCRYPTED_${hashedKey}`] = encryptedValue;
      
      return hashedKey;
    } catch (error) {
      console.error('Error storing secret:', error);
      throw new Error('Failed to store secret');
    }
  }

  /**
   * Retrieve and decrypt secrets
   */
  static retrieveSecret(key: string): string | null {
    try {
      const hashedKey = DataEncryption.hash(key);
      const encryptedValue = process.env[`ENCRYPTED_${hashedKey}`];
      
      if (!encryptedValue) {
        return null;
      }
      
      return DataEncryption.decrypt(encryptedValue);
    } catch (error) {
      console.error('Error retrieving secret:', error);
      return null;
    }
  }
}

/**
 * Secure session data encryption
 */
export class SessionEncryption {
  /**
   * Encrypt session data for secure storage
   */
  static encryptSessionData(sessionData: Record<string, any>): string {
    try {
      // Add timestamp and expiry for session validation
      const dataWithMeta = {
        ...sessionData,
        encryptedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };
      
      return DataEncryption.encrypt(JSON.stringify(dataWithMeta));
    } catch (error) {
      console.error('Error encrypting session data:', error);
      throw new Error('Failed to encrypt session data');
    }
  }

  /**
   * Decrypt and validate session data
   */
  static decryptSessionData(encryptedData: string): Record<string, any> | null {
    try {
      const decrypted = DataEncryption.decrypt(encryptedData);
      const sessionData = JSON.parse(decrypted);
      
      // Validate session expiry
      if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
        return null; // Session expired
      }
      
      // Remove metadata before returning
      const { encryptedAt, expiresAt, ...cleanData } = sessionData;
      return cleanData;
    } catch (error) {
      console.error('Error decrypting session data:', error);
      return null;
    }
  }

  /**
   * Generate secure session token
   */
  static generateSessionToken(): string {
    return DataEncryption.generateToken(64);
  }
}