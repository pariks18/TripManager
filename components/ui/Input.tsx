import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3.5 text-slate-400">{icon}</div>}
          <input
            ref={ref}
            className={cn(
              'w-full bg-slate-50 border border-slate-200 text-slate-900 text-base rounded-2xl py-3.5 transition-colors duration-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20',
              icon ? 'pl-11 pr-4' : 'px-4',
              error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-500 font-medium pl-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
