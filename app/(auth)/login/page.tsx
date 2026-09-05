'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, Sparkles, UserCheck } from 'lucide-react';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      setError('Please fill in both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    handleLogin(undefined, demoEmail, 'password123');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md mx-auto space-y-6 relative z-10">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div
            onClick={() => router.push('/')}
            className="w-12 h-12 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center font-extrabold text-white text-xl shadow-xl shadow-emerald-500/30 mx-auto cursor-pointer"
          >
            TN
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Welcome back</h2>
          <p className="text-xs text-slate-400">Sign in to manage your group trip expenses</p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button type="submit" fullWidth isLoading={isLoading} size="lg" className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold">
              Sign In
            </Button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="pt-3 border-t border-slate-700/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Instant Demo Accounts:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('parikshit@tripnizer.in')}
                className="bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/60 p-2 rounded-2xl text-[11px] font-semibold text-center transition-colors"
              >
                Parikshit
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('rahul@tripnizer.in')}
                className="bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/60 p-2 rounded-2xl text-[11px] font-semibold text-center transition-colors"
              >
                Rahul
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('akash@tripnizer.in')}
                className="bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/60 p-2 rounded-2xl text-[11px] font-semibold text-center transition-colors"
              >
                Akash
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-emerald-400 font-bold hover:underline">
            Register now
          </Link>
        </p>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={email}
        onSuccess={(resetEmail) => {
          setEmail(resetEmail);
          setPassword('');
          setError('');
        }}
      />
    </div>
  );
}
