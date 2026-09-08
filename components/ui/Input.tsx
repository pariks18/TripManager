import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  variant?: 'light' | 'dark';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      labelClassName,
      error,
      icon,
      rightIcon,
      className,
      containerClassName,
      variant = 'light',
      id,
      ...props
    },
    ref
  ) => {
    // Generate fallback id for accessibility if not provided
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    // Explicitly compute padding classes so tailwind-merge never overrides them with px-*
    const paddingLeft = icon ? 'pl-11' : 'pl-4';
    const paddingRight = rightIcon ? 'pr-12' : 'pr-4';

    const baseStyles =
      variant === 'dark'
        ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white';

    const labelColor = variant === 'dark' ? 'text-slate-300' : 'text-slate-700';

    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-xs font-semibold uppercase tracking-wider',
              labelColor,
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              // Base input styles
              'w-full h-11 sm:h-12 border text-sm rounded-2xl transition-all duration-200 font-medium',
              'placeholder:font-normal',
              'focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              baseStyles,
              error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : '',
              className,
              // Apply padding LAST to ensure icon spacing is never stripped by tailwind-merge
              paddingLeft,
              paddingRight
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 flex items-center justify-center shrink-0">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-500 font-medium pl-1 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
