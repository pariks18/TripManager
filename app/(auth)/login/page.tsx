'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
  ArrowRight,
  Sparkles,
  Receipt,
  Users,
  Compass
} from 'lucide-react';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpiredAlert = searchParams
    ? searchParams.get('expired') === 'true' || searchParams.get('reason') === 'session_expired'
    : false;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError('Please enter both your email address and password');
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
        throw new Error(data.error || 'Invalid email or password');
      }

      const returnUrl = searchParams ? searchParams.get('returnUrl') : null;
      router.push(returnUrl || '/dashboard');
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
      const res = await fetch('/api/auth/resend-verification-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to resend verification email');

      setResendMessage(data.message || 'A 6-digit verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-slate-950 text-white grid grid-cols-1 lg:grid-cols-12 relative overflow-x-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* LEFT SECTION: Travel Hero Showcase (Desktop only) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 lg:p-16 border-r border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950/80 relative overflow-hidden">
        {/* Subtle Map / Route Lines SVG Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-11 h-11 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/25">
            TN
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white">TripNizer</span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-emerald-400">Travel & Expenses</span>
          </div>
        </div>

        {/* Hero Middle Content */}
        <div className="relative z-10 my-auto space-y-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Group Travel Platform</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            Plan trips, split expenses, and create memories <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">effortlessly.</span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed">
            Welcome back! Log in to manage your active group itineraries, approve split costs, check settlement status, and stay connected with travel buddies.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Equal & Custom Splits</h3>
              <p className="text-xs text-slate-400">Track exact balances and settle up via UPI or cash instantly.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">AI Itineraries</h3>
              <p className="text-xs text-slate-400">Generates custom travel schedules tailored to your budget.</p>
            </div>
          </div>
        </div>

        {/* Bottom Quote / Footer info */}
        <div className="relative z-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Trusted by thousands of group travelers</span>
          </div>
          <span>v0.1.0 • Secure Auth</span>
        </div>
      </div>

      {/* RIGHT SECTION: Compact & Focused Login Form */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-12 relative z-10">
        {/* Mobile Header Logo */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center font-extrabold text-slate-950 text-lg shadow-md shadow-emerald-500/20">
              TN
            </div>
            <span className="text-xl font-black tracking-tight text-white">TripNizer</span>
          </div>
          <Link href="/register" className="text-xs font-semibold text-emerald-400 hover:underline">
            Create Account
          </Link>
        </div>

        <div className="my-auto w-full max-w-md mx-auto space-y-8 animate-fade-in-up">
          {/* Title Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Welcome back</h2>
            <p className="text-sm text-slate-400">Please enter your account details to sign in.</p>
          </div>

          {/* Session Expired Banner */}
          {sessionExpiredAlert && !error && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs font-medium text-amber-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>Your previous session expired or was reset. Please log in again to continue.</div>
            </div>
          )}

          {/* Card Form */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium text-rose-300 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{error}</div>
                </div>

                {requiresVerification && (
                  <div className="pt-3 border-t border-rose-500/20 flex items-center justify-between gap-2 flex-wrap">
                    <Link
                      href={`/verify-email-otp?email=${encodeURIComponent(unverifiedEmail || email.trim())}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Enter 6-Digit OTP <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="inline-flex items-center gap-1.5 py-1.5 text-rose-300 hover:text-rose-100 text-xs font-semibold disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                      {isResending ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {resendMessage && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-medium text-emerald-300 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>{resendMessage}</div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <Input
                variant="dark"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
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
                  variant="dark"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-200 transition-colors focus:outline-none p-1 rounded-lg hover:bg-slate-800 flex items-center justify-center shrink-0"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                size="lg"
                className="mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm py-4 shadow-lg shadow-emerald-500/20 rounded-2xl active:scale-[0.99] transition-all"
              >
                Sign In
              </Button>
            </form>
          </div>

          {/* Footer Register Link */}
          <div className="text-center text-xs text-slate-400">
            Don't have a TripNizer account yet?{' '}
            <Link href="/register" className="text-emerald-400 font-bold hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        {/* Modal */}
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="animate-pulse text-xs font-semibold text-slate-400">Loading sign in...</div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
