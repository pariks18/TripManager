'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, AlertCircle, XCircle, Loader2, ArrowRight, Mail, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams ? searchParams.get('token') : null;


  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'EXPIRED' | 'INVALID' | 'ALREADY_VERIFIED' | 'FAILED'>('LOADING');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendEmailInput, setResendEmailInput] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('INVALID');
      setMessage('No verification token provided in URL.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.status === 'SUCCESS') {
          setStatus('SUCCESS');
          setMessage(data.message || 'Your email address has been verified successfully!');
          if (data.email) setEmail(data.email);
        } else if (data.status === 'EXPIRED_TOKEN') {
          setStatus('EXPIRED');
          setMessage(data.error || 'This verification link has expired.');
          if (data.email) setResendEmailInput(data.email);
        } else if (data.status === 'ALREADY_VERIFIED') {
          setStatus('ALREADY_VERIFIED');
          setMessage(data.message || 'Your email is already verified.');
        } else {
          setStatus('INVALID');
          setMessage(data.error || 'Invalid or already used verification token.');
        }
      } catch (err: any) {
        setStatus('FAILED');
        setMessage('Network error while verifying email. Please try again.');
      }
    };

    verifyToken();
  }, [token]);

  const handleResend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = resendEmailInput || email;
    if (!targetEmail) {
      setResendError('Please enter your email address');
      return;
    }

    setIsResending(true);
    setResendMessage('');
    setResendError('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend verification email');

      setResendMessage(data.message || 'A new verification link has been sent to your email!');
    } catch (err: any) {
      setResendError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
      {/* State: LOADING */}
      {status === 'LOADING' && (
        <div className="space-y-4 py-6">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-100">Verifying Email...</h3>
          <p className="text-xs text-slate-400">Please wait while we validate your secure token.</p>
        </div>
      )}

      {/* State: SUCCESS */}
      {status === 'SUCCESS' && (
        <div className="space-y-5">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Email Verified!</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">{message}</p>
          </div>
          <Link href="/login" className="block pt-2">
            <Button fullWidth size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold">
              Sign In to TripNizer <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* State: ALREADY_VERIFIED */}
      {status === 'ALREADY_VERIFIED' && (
        <div className="space-y-5">
          <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/40 rounded-full flex items-center justify-center mx-auto text-blue-400">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Already Verified</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">{message}</p>
          </div>
          <Link href="/login" className="block pt-2">
            <Button fullWidth size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold">
              Go to Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* State: EXPIRED */}
      {status === 'EXPIRED' && (
        <div className="space-y-5">
          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Verification Link Expired</h3>
            <p className="text-xs text-amber-200/90 leading-relaxed max-w-sm mx-auto">{message}</p>
          </div>

          <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Your Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={resendEmailInput}
                onChange={(e) => setResendEmailInput(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />
            </div>

            {resendMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-medium text-emerald-300">
                {resendMessage}
              </div>
            )}
            {resendError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium text-rose-300">
                {resendError}
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isResending} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold">
              <RefreshCw className="w-4 h-4 mr-1.5" /> Request New Verification Link
            </Button>
          </form>
        </div>
      )}

      {/* State: INVALID / FAILED */}
      {(status === 'INVALID' || status === 'FAILED') && (
        <div className="space-y-5">
          <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto text-rose-400">
            <XCircle className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Verification Failed</h3>
            <p className="text-xs text-rose-300/90 leading-relaxed max-w-sm mx-auto">{message}</p>
          </div>

          <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Resend Link to Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={resendEmailInput}
                onChange={(e) => setResendEmailInput(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />
            </div>

            {resendMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-medium text-emerald-300">
                {resendMessage}
              </div>
            )}
            {resendError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium text-rose-300">
                {resendError}
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isResending} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold">
              Send Verification Email
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  const router = useRouter();

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
          <h2 className="text-2xl font-extrabold tracking-tight">TripNizer Email Verification</h2>
        </div>

        <Suspense fallback={
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 text-center text-slate-400">
            Loading verification page...
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
