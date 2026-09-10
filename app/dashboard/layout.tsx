import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Dashboard - TripNizer',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-[#04160f] via-[#062c1f] to-[#03100b] text-slate-100 pb-20 md:pb-6 selection:bg-emerald-500 selection:text-slate-950">
      {children}
    </div>
  );
}
