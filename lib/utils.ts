import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate random 6-character uppercase Trip Code (e.g., ABCD12)
export function generateTripCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate valid 24-character hexadecimal MongoDB ObjectId
export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomHex = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (timestamp + randomHex).slice(0, 24);
}

export function formatCurrency(amount: number, currency: string = '₹'): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Math.abs(amount));

  if (amount < 0) {
    return `-${currency}${formatted}`;
  } else if (amount > 0) {
    return `+${currency}${formatted}`;
  }
  return `${currency}0`;
}

export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function formatTime(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

export function formatRelativeTime(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return formatDate(date);
}

export const CATEGORY_CONFIG: Record<string, { icon: string; bg: string; text: string }> = {
  Food: { icon: 'Utensils', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', text: 'text-emerald-600' },
  Travel: { icon: 'Plane', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300', text: 'text-blue-600' },
  Fuel: { icon: 'Fuel', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', text: 'text-amber-600' },
  Stay: { icon: 'Home', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300', text: 'text-purple-600' },
  Entertainment: { icon: 'Ticket', bg: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300', text: 'text-pink-600' },
  Shopping: { icon: 'ShoppingBag', bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', text: 'text-indigo-600' },
  Miscellaneous: { icon: 'Sparkles', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', text: 'text-slate-600' }
};
