import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'TripNizer - Mobile Expense Splitter for Groups',
  description: 'Effortlessly split trip expenses with friends. Less Math. More Travel.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'TripNizer - Mobile Expense Splitter for Groups',
    description: 'Effortlessly split trip expenses with friends. Less Math. More Travel.',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: 'TripNizer Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TripNizer - Mobile Expense Splitter for Groups',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 overflow-x-hidden max-w-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#f8fafc" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden antialiased font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
