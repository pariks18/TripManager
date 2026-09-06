import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'TripNizer - Mobile Expense Splitter for Groups',
  description: 'Effortlessly split trip expenses with friends. No manual calculations required.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#020617" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen min-h-[100dvh] w-full antialiased font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
