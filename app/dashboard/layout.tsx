import React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 text-slate-900 pb-20 md:pb-6">
      {children}
    </div>
  );
}
