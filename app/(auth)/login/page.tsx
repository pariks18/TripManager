'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, AlertTriangle, CheckCircle, RefreshCw, Info } from 'lucide-react';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpiredAlert = searchParams ? (searchParams.get('expired') === 'true' || searchParams.get('reason') === 'session_expired') : false;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    setRequiresVerification(false);
    setResendMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          setRequiresVerification(true);
          setUnverifiedEmail(data.email || email.trim());
        }
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = unverifiedEmail || email.trim();
    if (!targetEmail) return;

    setIsResending(true);
    setResendMessage('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to resend verification email');

      setResendMessage(data.message || 'A new verification email has been sent!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
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

        {/* Session Expired Banner */}
        {sessionExpiredAlert && !error && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs font-medium text-amber-300 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>Your session has expired or the database was reset. Please log in again.</div>
          </div>
        )}

        {/* Card Form */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium text-rose-300 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>

              {requiresVerification && (
                <div className="pt-2 border-t border-rose-500/20">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    {isResending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              )}
            </div>
          )}

          {resendMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-medium text-emerald-300 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>{resendMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Loading sign in...
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
