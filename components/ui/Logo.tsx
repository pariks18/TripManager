import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface LogoProps {
  /**
   * Layout variant:
   * - 'full': Displays the complete official logo asset including mark and brand name.
   * - 'icon': Displays a compact icon badge version.
   */
  variant?: 'full' | 'icon';
  /**
   * Predefined size presets:
   * - 'sm': compact (header/footer/mobile)
   * - 'md': standard (dashboard/navbar)
   * - 'lg': prominent (auth cards/modals)
   * - 'xl': showcase (hero/splash/404)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Optional Link destination (e.g. '/' or '/dashboard')
   */
  href?: string;
  /**
   * Set true when placing the logo on dark/emerald backgrounds (adds high-contrast light container per brand rules)
   */
  onDarkBackground?: boolean;
  /**
   * Show tagline under logo
   */
  showTagline?: boolean;
  /**
   * Custom CSS classes for the container
   */
  className?: string;
  /**
   * Priority loading for critical LCP images
   */
  priority?: boolean;
}

const SIZE_PRESETS = {
  sm: {
    containerHeight: 32,
    badgeSize: 'w-8 h-8 p-1',
    textSize: 'text-base',
    taglineSize: 'text-[9px]',
  },
  md: {
    containerHeight: 40,
    badgeSize: 'w-10 h-10 p-1',
    textSize: 'text-xl',
    taglineSize: 'text-[10px]',
  },
  lg: {
    containerHeight: 52,
    badgeSize: 'w-13 h-13 p-1.5',
    textSize: 'text-2xl',
    taglineSize: 'text-xs',
  },
  xl: {
    containerHeight: 72,
    badgeSize: 'w-20 h-20 p-2',
    textSize: 'text-3xl',
    taglineSize: 'text-sm',
  },
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  href,
  onDarkBackground = false,
  showTagline = false,
  className,
  priority = false,
}) => {
  const preset = SIZE_PRESETS[size] || SIZE_PRESETS.md;

  const content = (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 select-none group transition-all duration-200',
        className
      )}
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl overflow-hidden transition-transform duration-200 group-hover:scale-105 shrink-0',
          onDarkBackground
            ? 'bg-white p-1 shadow-md shadow-emerald-500/10 ring-1 ring-white/30'
            : 'bg-white p-1 border border-slate-200/80 shadow-sm',
          preset.badgeSize
        )}
      >
        <Image
          src="/logo.png"
          alt="TripNizer - Less Math. More Travel."
          width={preset.containerHeight * 2}
          height={preset.containerHeight * 2}
          priority={priority}
          className="w-full h-full object-contain mix-blend-multiply"
        />
      </div>

      {variant === 'full' && (
        <div className="flex flex-col">
          <span
            className={cn(
              'font-black tracking-tight leading-none',
              onDarkBackground ? 'text-white' : 'text-slate-900',
              preset.textSize
            )}
          >
            TripNizer
          </span>
          {showTagline && (
            <span
              className={cn(
                'font-bold tracking-wider uppercase mt-1 leading-none',
                onDarkBackground ? 'text-emerald-400' : 'text-emerald-600',
                preset.taglineSize
              )}
            >
              Less Math. More Travel.
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-2xl">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
