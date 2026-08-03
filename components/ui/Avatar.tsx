import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const COLOR_PALETTES = [
  'bg-emerald-500 text-white',
  'bg-blue-500 text-white',
  'bg-amber-500 text-white',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
  'bg-indigo-500 text-white',
  'bg-teal-500 text-white',
];

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className }) => {
  const getInitials = (n: string) => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Deterministic color selection based on name hash
  const colorIndex = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % COLOR_PALETTES.length;
  const colorClass = COLOR_PALETTES[colorIndex];

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs font-semibold',
    md: 'w-10 h-10 text-sm font-bold',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-16 h-16 text-xl font-bold',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shadow-inner tracking-wider select-none shrink-0',
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
