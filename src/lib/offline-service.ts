'use client';

// Offline service for managing cached data and sync functionality
export class OfflineService {
  private static instance: OfflineService;
  private readonly STORAGE_KEYS = {
    PURCHASES: 'electricityTokens-purchases',
    CONTRIBUTIONS: 'electricityTokens-contributions', 
    USER_DATA: 'electricityTokens-userData',
    PENDING_ACTIONS: 'electricityTokens-pendingActions',
    LAST_SYNC: 'electricityTokens-lastSync',
  };

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  // Check if we're online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Store data for offline access
  cacheData(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  // Retrieve cached data
  getCachedData(key: string, maxAge: number = 24 * 60 * 60 * 1000): any {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const { data, timestamp } = JSON.parse(stored);
      const age = Date.now() - timestamp;

      if (age > maxAge) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
      return null;
    }
  }

  // Cache purchases data
  cachePurchases(purchases: any[]): void {
    this.cacheData(this.STORAGE_KEYS.PURCHASES, purchases);
    this.updateLastSync();
  }

  // Get cached purchases
  getCachedPurchases(): any[] {
    return this.getCachedData(this.STORAGE_KEYS.PURCHASES) || [];
  }

  // Cache contributions data
  cacheContributions(contributions: any[]): void {
    this.cacheData(this.STORAGE_KEYS.CONTRIBUTIONS, contributions);
    this.updateLastSync();
  }

  // Get cached contributions
  getCachedContributions(): any[] {
    return this.getCachedData(this.STORAGE_KEYS.CONTRIBUTIONS) || [];
  }

  // Cache user data
  cacheUserData(userData: any): void {
    this.cacheData(this.STORAGE_KEYS.USER_DATA, userData);
  }

  // Get cached user data
  getCachedUserData(): any {
    return this.getCachedData(this.STORAGE_KEYS.USER_DATA);
  }

  // Store pending actions for when back online
  addPendingAction(action: {
    type: 'CREATE_PURCHASE' | 'UPDATE_PURCHASE' | 'DELETE_PURCHASE' | 'CREATE_CONTRIBUTION';
    data: any;
    timestamp: number;
  }): void {
    try {
      const pending = this.getPendingActions();
      pending.push({
        ...action,
        id: `${action.type}_${Date.now()}_${Math.random()}`,
      });
      localStorage.setItem(this.STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(pending));
    } catch (error) {
      console.error('Failed to store pending action:', error);
    }
  }

  // Get pending actions
  getPendingActions(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.PENDING_ACTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve pending actions:', error);
      return [];
    }
  }

  // Clear pending actions (after successful sync)
  clearPendingActions(): void {
    localStorage.removeItem(this.STORAGE_KEYS.PENDING_ACTIONS);
  }

  // Update last sync timestamp
  updateLastSync(): void {
    localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  }

  // Get last sync timestamp
  getLastSync(): Date | null {
    try {
      const timestamp = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
      return timestamp ? new Date(parseInt(timestamp)) : null;
    } catch (error) {
      return null;
    }
  }

  // Calculate cache age
  getCacheAge(): string {
    const lastSync = this.getLastSync();
    if (!lastSync) return 'Never synced';

    const ageMs = Date.now() - lastSync.getTime();
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDays = Math.floor(ageHours / 24);

    if (ageDays > 0) return `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
    if (ageHours > 0) return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
    if (ageMinutes > 0) return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  // Clear all offline data
  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Check if we have valid cached data
  hasValidCache(): boolean {
    const purchases = this.getCachedPurchases();
    const lastSync = this.getLastSync();
    
    return purchases.length > 0 && lastSync !== null;
  }

  // Sync pending actions when back online
  async syncPendingActions(): Promise<{ success: boolean; errors: any[] }> {
    if (!this.isOnline()) {
      return { success: false, errors: ['Device is offline'] };
    }

    const pendingActions = this.getPendingActions();
    if (pendingActions.length === 0) {
      return { success: true, errors: [] };
    }

    const errors: any[] = [];
    let successCount = 0;

    for (const action of pendingActions) {
      try {
        await this.executePendingAction(action);
        successCount++;
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        errors.push({ action, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    if (errors.length === 0) {
      this.clearPendingActions();
    }

    return {
      success: successCount === pendingActions.length,
      errors,
    };
  }

  // Execute a pending action
  private async executePendingAction(action: any): Promise<void> {
    const { type, data } = action;
    
    switch (type) {
      case 'CREATE_PURCHASE':
        await fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        break;
      
      case 'UPDATE_PURCHASE':
        await fetch(`/api/purchases/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        break;
      
      case 'DELETE_PURCHASE':
        await fetch(`/api/purchases/${data.id}`, {
          method: 'DELETE',
        });
        break;
      
      case 'CREATE_CONTRIBUTION':
        await fetch('/api/contributions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        break;
      
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }
}