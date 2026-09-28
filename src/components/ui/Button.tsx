'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'ghost'
  | 'outline';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow focus-visible:ring-blue-500 border-transparent dark:bg-blue-600 dark:hover:bg-blue-500',
  secondary:
    'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border-slate-200 focus-visible:ring-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700',
  success:
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow focus-visible:ring-emerald-500 border-transparent dark:bg-emerald-600 dark:hover:bg-emerald-500',
  danger:
    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm hover:shadow focus-visible:ring-red-500 border-transparent dark:bg-red-600 dark:hover:bg-red-500',
  warning:
    'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold shadow-sm hover:shadow focus-visible:ring-amber-400 border-transparent dark:bg-amber-500 dark:hover:bg-amber-400',
  ghost:
    'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 border-transparent focus-visible:ring-slate-400 dark:hover:bg-slate-800 dark:text-slate-300',
  outline:
    'bg-transparent hover:bg-slate-50 active:bg-slate-100 text-slate-700 border-slate-300 focus-visible:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs py-1.5 px-3 min-h-[36px] sm:min-h-[36px] gap-1.5 rounded-lg',
  md: 'text-sm py-2 px-4 min-h-[44px] gap-2 rounded-xl', // 44px touch-friendly minimum
  lg: 'text-base py-3 px-6 min-h-[48px] gap-2.5 rounded-xl font-black',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`
          inline-flex items-center justify-center font-bold border transition-all duration-150 select-none
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          cursor-pointer
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0 me-1.5" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
            <span className="truncate">{children}</span>
            {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
