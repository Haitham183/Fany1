'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rounded',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-none',
    rounded: 'rounded-2xl',
  };

  return (
    <div
      role="status"
      aria-label="جارٍ التحميل..."
      className={`
        animate-pulse bg-slate-200 dark:bg-slate-800
        ${variantStyles[variant]}
        ${className}
      `}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};
