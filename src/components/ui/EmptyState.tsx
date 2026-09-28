'use client';

import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`
        p-8 sm:p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800
        bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center space-y-3
        ${className}
      `}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-1">
        {icon || <Inbox className="w-7 h-7" />}
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
