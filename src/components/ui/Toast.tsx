'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, RotateCcw } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onUndo?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, onUndo?: () => void) => string;
  error: (title: string, message?: string, onUndo?: () => void) => string;
  warning: (title: string, message?: string, onUndo?: () => void) => string;
  info: (title: string, message?: string, onUndo?: () => void) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? (toast.onUndo ? 7000 : 4500);
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string, onUndo?: () => void) =>
      showToast({ type: 'success', title, message, onUndo }),
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, onUndo?: () => void) =>
      showToast({ type: 'error', title, message, onUndo }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string, onUndo?: () => void) =>
      showToast({ type: 'warning', title, message, onUndo }),
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, onUndo?: () => void) =>
      showToast({ type: 'info', title, message, onUndo }),
    [showToast]
  );

  const typeConfig: Record<
    ToastType,
    { icon: React.ReactNode; border: string; bg: string; text: string }
  > = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
      border: 'border-emerald-500/40',
      bg: 'bg-white dark:bg-slate-900',
      text: 'text-slate-900 dark:text-slate-100',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
      border: 'border-red-500/40',
      bg: 'bg-white dark:bg-slate-900',
      text: 'text-slate-900 dark:text-slate-100',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
      border: 'border-amber-500/40',
      bg: 'bg-white dark:bg-slate-900',
      text: 'text-slate-900 dark:text-slate-100',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
      border: 'border-blue-500/40',
      bg: 'bg-white dark:bg-slate-900',
      text: 'text-slate-900 dark:text-slate-100',
    },
  };

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, removeToast, success, error, warning, info }}
    >
      {children}

      {/* Toast Notification Container (Fixed at Bottom-End on Mobile/Desktop) */}
      <div
        aria-live="polite"
        className="fixed z-50 bottom-4 start-4 end-4 sm:end-auto sm:start-4 sm:w-96 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => {
          const config = typeConfig[toast.type];

          return (
            <div
              key={toast.id}
              role="alert"
              className={`
                pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3
                animate-in slide-in-from-bottom-5 duration-200
                ${config.border} ${config.bg} ${config.text}
              `}
            >
              {config.icon}

              <div className="flex-1 space-y-1 min-w-0">
                <p className="text-xs font-black leading-snug">{toast.title}</p>
                {toast.message && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {toast.message}
                  </p>
                )}

                {toast.onUndo && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.onUndo?.();
                      removeToast(toast.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-black text-blue-600 dark:text-blue-400 hover:underline pt-1 cursor-pointer min-h-[36px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{toast.undoLabel || 'تراجع عن الإجراء فوراً (Undo)'}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="إغلاق الإشعار"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
