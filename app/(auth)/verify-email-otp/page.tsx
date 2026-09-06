'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

function VerifyEmailOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams ? searchParams.get('email') || '' : '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [cooldown, setCooldown] = useState(0); // Resend cooldown in seconds
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // 10-minute expiry countdown
  useEffect(() => {
    if (timeLeft <= 0 || isVerified) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, isVerified]);

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input if filled
    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    // Focus last pasted or next empty input
    const targetIdx = Math.min(pasted.length, 5);
    const targetInput = document.getElementById(`otp-input-${targetIdx}`);
    if (targetInput) targetInput.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    if (!email) {
      setError('Email address is missing. Please enter your email.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResendMessage('');

    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: fullOtp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setIsVerified(true);
      setSuccessMessage(data.message || 'Email verified successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address to resend code.');
      return;
    }

    if (cooldown > 0) return;

    setIsResending(true);
    setError('');
    setResendMessage('');

    try {
      const res = await fetch('/api/auth/resend-verification-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.waitSeconds) setCooldown(data.waitSeconds);
        throw new Error(data.error || 'Failed to resend verification code');
      }

      setResendMessage(data.message || 'A new 6-digit code has been sent!');
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(600); // Reset timer to 10m
      setCooldown(30); // 30s cooldown
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-fade-in-up">
      {isVerified ? (
        /* Success View */
        <div className="space-y-5 py-2">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">Email Verified!</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">{successMessage}</p>
          </div>
          <Link href="/login" className="block pt-2">
            <Button
              fullWidth
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm py-4 shadow-lg shadow-emerald-500/20 rounded-2xl active:scale-[0.99] transition-all"
            >
              Sign In to TripNizer <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      ) : (
        /* OTP Form View */
        <div className="space-y-5">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-white tracking-tight">Verify Your Email</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We've sent a 6-digit verification code to<br />
              <span className="font-semibold text-emerald-400">{email || 'your email'}</span>
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium text-rose-300 flex items-start gap-2.5 text-left">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {resendMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-medium text-emerald-300 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>{resendMessage}</div>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {/* 6-Digit Box Inputs */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-9 sm:w-12 h-12 sm:h-14 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-center font-mono text-lg sm:text-2xl font-extrabold text-emerald-400 rounded-xl sm:rounded-2xl transition-all outline-none"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Timer display */}
            <div className="text-xs text-slate-400 font-medium">
              {timeLeft > 0 ? (
                <span>
                  Code expires in <strong className="text-amber-400 font-mono">{formatTime(timeLeft)}</strong>
                </span>
              ) : (
                <span className="text-rose-400 font-semibold">Code expired. Please request a new OTP.</span>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm py-4 shadow-lg shadow-emerald-500/20 rounded-2xl active:scale-[0.99] transition-all"
            >
              Verify Email
            </Button>
          </form>

          {/* Resend Section */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : isResending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailOtpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-slate-950 text-white flex flex-col justify-center p-4 sm:p-8 relative overflow-x-hidden selection:bg-emerald-500 selection:text-slate-950">
      {/* Glow shapes */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto space-y-6 relative z-10">
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <div
            onClick={() => router.push('/')}
            className="w-12 h-12 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/25 mx-auto cursor-pointer"
          >
            TN
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">TripNizer Verification</h2>
        </div>

        <Suspense
          fallback={
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
              Loading verification screen...
            </div>
          }
        >
          <VerifyEmailOtpContent />
        </Suspense>
      </div>
    </div>
  );
}
