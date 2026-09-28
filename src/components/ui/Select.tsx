'use client';

import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      children,
      id,
      className = '',
      containerClassName = '',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    const errorId = error && selectId ? `${selectId}-error` : undefined;
    const helperId = helperText && selectId ? `${selectId}-helper` : undefined;

    return (
      <div className={`w-full space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 select-none"
          >
            {label}
            {required && <span className="text-red-500 ms-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId || helperId}
          className={`
            w-full min-h-[44px] rounded-xl text-sm font-bold transition-all duration-150
            bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100
            ps-3.5 pe-8 py-2 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
            }
            ${className}
          `}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

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

Select.displayName = 'Select';
