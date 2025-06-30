'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, options?: Partial<Toast>) => void;
  error: (message: string, options?: Partial<Toast>) => void;
  warning: (message: string, options?: Partial<Toast>) => void;
  info: (message: string, options?: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  }, [removeToast]);

  const success = useCallback((message: string, options?: Partial<Toast>) => {
    addToast({ type: 'success', message, ...options });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Toast>) => {
    addToast({ type: 'error', message, duration: 7000, ...options });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Toast>) => {
    addToast({ type: 'warning', message, ...options });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Toast>) => {
    addToast({ type: 'info', message, ...options });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      addToast, 
      removeToast, 
      success, 
      error, 
      warning, 
      info 
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ 
  toasts, 
  removeToast 
}: { 
  toasts: Toast[]; 
  removeToast: (id: string) => void; 
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ 
  toast, 
  onRemove 
}: { 
  toast: Toast; 
  onRemove: (id: string) => void; 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const variants = {
    success: {
      container: 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      IconComponent: CheckCircle
    },
    error: {
      container: 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      IconComponent: XCircle
    },
    warning: {
      container: 'bg-white dark:bg-slate-800 border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      IconComponent: AlertTriangle
    },
    info: {
      container: 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      IconComponent: Info
    }
  };

  const { container, icon, IconComponent } = variants[toast.type];

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-lg border shadow-lg transition-all duration-300',
        container,
        isVisible && !isExiting 
          ? 'transform translate-x-0 opacity-100' 
          : 'transform translate-x-full opacity-0'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <IconComponent className={cn('h-5 w-5 flex-shrink-0 mt-0.5', icon)} />
          
          <div className="flex-1 space-y-1">
            {toast.title && (
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {toast.title}
              </h4>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {toast.message}
            </p>
            
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          <button
            onClick={handleRemove}
            className="flex-shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}