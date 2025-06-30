'use client';

import { useState, useEffect } from 'react';

interface OfflineData {
  purchases: any[];
  contributions: any[];
  lastSync: string;
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Load offline data from localStorage
    const stored = localStorage.getItem('electricityTokens-offline');
    if (stored) {
      try {
        setOfflineData(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing offline data:', error);
      }
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOfflineData = (data: Partial<OfflineData>) => {
    const updatedData: OfflineData = {
      purchases: offlineData?.purchases || [],
      contributions: offlineData?.contributions || [],
      lastSync: new Date().toISOString(),
      ...data,
    };
    setOfflineData(updatedData);
    localStorage.setItem('electricityTokens-offline', JSON.stringify(updatedData));
  };

  const clearOfflineData = () => {
    setOfflineData(null);
    localStorage.removeItem('electricityTokens-offline');
  };

  const getOfflineData = (key: keyof OfflineData) => {
    return offlineData?.[key] || null;
  };

  const hasOfflineData = () => {
    return offlineData !== null;
  };

  return {
    isOnline,
    offlineData,
    saveOfflineData,
    clearOfflineData,
    getOfflineData,
    hasOfflineData,
  };
}