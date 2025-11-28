'use client';

import { useState, createContext, useContext } from 'react';
import { AlertTriangle, Trash2, X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AlertOptions {
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AlertContextType {
  alert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<(AlertOptions & { id: string })[]>([]);

  const alert = (options: AlertOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newAlert = { ...options, id };
    setAlerts(prev => [...prev, newAlert]);

    // Auto-dismiss after duration
    if (options.duration !== 0) {
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== id));
      }, options.duration || 5000);
    }
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {alerts.map((alert) => (
          <AlertToast
            key={alert.id}
            {...alert}
            onDismiss={() => dismissAlert(alert.id)}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

interface AlertToastProps extends AlertOptions {
  id: string;
  onDismiss: () => void;
}

function AlertToast({
  title,
  description,
  variant = 'info',
  action,
  onDismiss
}: AlertToastProps) {
  const variants = {
    success: {
      container: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      IconComponent: CheckCircle
    },
    error: {
      container: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      IconComponent: AlertCircle
    },
    warning: {
      container: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      IconComponent: AlertTriangle
    },
    info: {
      container: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      IconComponent: Info
    }
  };

  const { container, icon, IconComponent } = variants[variant];

  return (
    <div className={cn(
      'max-w-sm w-full rounded-lg border p-4 shadow-lg',
      container
    )}>
      <div className="flex items-start gap-3">
        <IconComponent className={cn('h-5 w-5 mt-0.5', icon)} />
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {title}
          </h4>
          {description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          )}
          {action && (
            <Button
              size="sm"
              variant="outline"
              onClick={action.onClick}
              className="mt-2 h-7 px-2 text-xs"
            >
              {action.label}
            </Button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ComponentType<{ className?: string }>;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmationOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirm = (options: ConfirmationOptions) => {
    setDialog(options);
  };

  const handleConfirm = async () => {
    if (!dialog) return;
    
    try {
      setIsLoading(true);
      await dialog.onConfirm();
      setDialog(null);
    } catch (error) {
      // console.error removed
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!dialog) return;
    dialog.onCancel?.();
    setDialog(null);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <ConfirmationDialog
          {...dialog}
          isLoading={isLoading}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}

interface ConfirmationDialogProps extends ConfirmationOptions {
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon: Icon,
  isLoading,
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  const variants = {
    danger: {
      container: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      container: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      container: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  };

  const { container, icon, confirmButton } = variants[variant];
  const IconComponent = Icon || (variant === 'danger' ? Trash2 : AlertTriangle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className={cn(
        'relative bg-white dark:bg-slate-900 rounded-lg shadow-xl border max-w-md w-full mx-4 p-6',
        container
      )}>
        <div className="flex items-start gap-4">
          <div className={cn('rounded-full p-2', icon)}>
            <IconComponent className="h-6 w-6" />
          </div>
          
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(confirmButton, 'flex-1 dark:bg-red-600 dark:hover:bg-red-700 dark:text-white')}
              >
                {isLoading ? 'Processing...' : confirmLabel}
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:border-slate-600"
              >
                {cancelLabel}
              </Button>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper hooks for common confirmation patterns
export function useDeleteConfirmation() {
  const { confirm } = useConfirmation();
  
  return (itemName: string, onConfirm: () => void | Promise<void>) => {
    confirm({
      title: `Delete ${itemName}?`,
      description: `This action cannot be undone. This will permanently delete the ${itemName} and all associated data.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      icon: Trash2,
      onConfirm
    });
  };
}

export function useDiscardChangesConfirmation() {
  const { confirm } = useConfirmation();
  
  return (onConfirm: () => void | Promise<void>) => {
    confirm({
      title: 'Discard changes?',
      description: 'You have unsaved changes. Are you sure you want to discard them?',
      confirmLabel: 'Discard',
      variant: 'warning',
      onConfirm
    });
  };
}