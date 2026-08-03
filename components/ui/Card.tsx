import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, interactive = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-3xl p-5 border border-slate-100 apple-shadow transition-all duration-200',
        interactive && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-[0.99]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
