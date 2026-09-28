'use client';

import React from 'react';
import { ArrowUpRight, ChevronLeft } from 'lucide-react';

export interface ActionableKpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral' | 'urgent';
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'slate';
  onClick?: () => void;
  badgeText?: string;
  actionHint?: string;
}

const variantStyles = {
  blue: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-blue-200 dark:border-blue-900/60 hover:border-blue-400',
    iconBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    textVal: 'text-blue-950 dark:text-blue-100',
  },
  emerald: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400',
    iconBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    textVal: 'text-emerald-950 dark:text-emerald-100',
  },
  amber: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400',
    iconBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    textVal: 'text-amber-950 dark:text-amber-100',
  },
  red: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-red-200 dark:border-red-900/60 hover:border-red-400',
    iconBg: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300',
    textVal: 'text-red-950 dark:text-red-100',
  },
  purple: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-purple-200 dark:border-purple-900/60 hover:border-purple-400',
    iconBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    textVal: 'text-purple-950 dark:text-purple-100',
  },
  slate: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800 hover:border-slate-400',
    iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    textVal: 'text-slate-950 dark:text-slate-100',
  },
};

export const ActionableKpiCard: React.FC<ActionableKpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType = 'neutral',
  variant = 'blue',
  onClick,
  badgeText,
  actionHint = 'انقر للتفاصيل',
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        p-4 sm:p-5 rounded-2xl border shadow-xs transition-all duration-200 text-start
        flex flex-col justify-between gap-3 select-none
        ${styles.bg} ${styles.border}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight truncate">
              {title}
            </span>
            {badgeText && (
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300">
                {badgeText}
              </span>
            )}
          </div>

          <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${styles.textVal}`}>
            {value}
          </div>
        </div>

        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
        <span className="truncate">{subtitle || trend || 'محدث لحظياً'}</span>

        {onClick && (
          <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5 shrink-0 hover:underline">
            <span>{actionHint}</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
};
