'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      startIcon,
      endIcon,
      id,
      className = '',
      containerClassName = '',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const helperId = helperText && inputId ? `${inputId}-helper` : undefined;

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 select-none"
          >
            {label}
            {required && <span className="text-red-500 ms-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute start-3 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId || helperId}
            className={`
              w-full min-h-[44px] rounded-xl text-sm font-medium transition-all duration-150
              bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-offset-1
              disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
              ${startIcon ? 'ps-10' : 'ps-3.5'}
              ${endIcon ? 'pe-10' : 'pe-3.5'}
              ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
              }
              ${className}
            `}
            {...props}
          />

          {endIcon && (
            <div className="absolute end-3 text-slate-400 dark:text-slate-500 flex items-center">
              {endIcon}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-[11px] font-bold text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-[11px] text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
