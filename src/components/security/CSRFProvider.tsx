'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CSRFProtection } from '@/lib/security';

interface CSRFContextType {
  token: string | null;
  refreshToken: () => void;
  isLoading: boolean;
}

const CSRFContext = createContext<CSRFContextType>({
  token: null,
  refreshToken: () => {},
  isLoading: true,
});

export function useCSRF() {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
}

interface CSRFProviderProps {
  children: React.ReactNode;
}

export function CSRFProvider({ children }: CSRFProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const generateNewToken = () => {
    const newToken = CSRFProtection.generateToken();
    setToken(newToken);
    
    // Store in session storage for persistence across page reloads
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf-token', newToken);
    }
    
    return newToken;
  };

  const refreshToken = () => {
    generateNewToken();
  };

  useEffect(() => {
    // Check for existing token in session storage
    if (typeof window !== 'undefined') {
      const existingToken = sessionStorage.getItem('csrf-token');
      if (existingToken) {
        setToken(existingToken);
      } else {
        generateNewToken();
      }
    } else {
      generateNewToken();
    }
    
    setIsLoading(false);
  }, []);

  // Auto-refresh token every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshToken();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <CSRFContext.Provider value={{ token, refreshToken, isLoading }}>
      {children}
    </CSRFContext.Provider>
  );
}

/**
 * Hook to get CSRF headers for API requests
 */
export function useCSRFHeaders() {
  const { token } = useCSRF();
  
  return token ? {
    'X-CSRF-Token': token,
    'X-CSRF-Expected': token,
  } : {};
}

/**
 * Enhanced fetch function with automatic CSRF token inclusion
 */
export function useSecureFetch() {
  const csrfHeaders = useCSRFHeaders();
  
  return async (url: string, options: RequestInit = {}) => {
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
      options.method?.toUpperCase() || 'GET'
    );

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(isStateChanging ? csrfHeaders : {}),
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };
}