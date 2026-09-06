'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Mail, Lock, CheckCircle, MailCheck, RefreshCw, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setRegisteredEmail(email.trim());
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setIsResending(true);
    setResendMessage('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend email');
      setResendMessage(data.message || 'Verification email resent successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md mx-auto space-y-6 relative z-10">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div
            onClick={() => router.push('/')}
            className="w-12 h-12 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center font-extrabold text-white text-xl shadow-xl shadow-emerald-500/30 mx-auto cursor-pointer"
          >
            TN
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {isSuccess ? 'Check Your Email' : 'Create an Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {isSuccess
              ? 'We sent a verification link to activate your account'
              : 'Join TripNizer to split expenses effortlessly'}
          </p>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <MailCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-100">Verification Link Sent</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We've sent a verification email to{' '}
                <span className="font-semibold text-emerald-400">{registeredEmail}</span>. Please verify your email before logging in.
              </p>
            </div>

            {resendMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-medium text-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resendMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium text-rose-300">
                {error}
              </div>
            )}

            <div className="pt-2 space-y-3">
              <Link href="/login">
                <Button fullWidth size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold">
                  Go to Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>

              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Sending...' : "Didn't receive an email? Resend"}
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 shadow-2xl space-y-5">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Full Name
                </label>
                <Input
                  placeholder="Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="At least 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              <Button type="submit" fullWidth isLoading={isLoading} size="lg" className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold">
                Create Account
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

