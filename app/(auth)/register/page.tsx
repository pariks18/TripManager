'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchClientSession } from '@/lib/clientSession';
import Logo from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Users,
  ChevronDown,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Globe,
  Compass
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClientSession().then((meUser) => {
      if (meUser) {
        router.replace('/dashboard');
      }
    });
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !dob || !gender) {
      setError('Please fill in all required profile fields');
      return;
    }

    if (new Date(dob) > new Date()) {
      setError('Date of Birth cannot be set in the future');
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
          dob: dob.trim(),
          gender: gender.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push(`/verify-email-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-slate-950 text-white grid grid-cols-1 lg:grid-cols-12 relative overflow-x-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* LEFT SECTION: Travel Hero Showcase (Desktop only) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 lg:p-16 border-r border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950/80 relative overflow-hidden">
        {/* Subtle SVG Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Top Brand Header */}
        <div className="relative z-10">
          <Logo variant="full" size="lg" href="/" onDarkBackground showTagline priority />
        </div>

        {/* Hero Middle Content */}
        <div className="relative z-10 my-auto space-y-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Your Free Account</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            Start managing trip expenses <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">in seconds.</span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed">
            Create your profile to create group trips, split expenses accurately, organize itineraries, and share travel memories with friends.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">6-Digit Email Security</h3>
              <p className="text-xs text-slate-400">Single-use OTP verification keeps your account 100% safe.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Multi-Currency Ready</h3>
              <p className="text-xs text-slate-400">Handle domestic and international group trip budgets easily.</p>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="relative z-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Fast setup • No credit card required</span>
          </div>
          <span>Free Forever Plan</span>
        </div>
      </div>

      {/* RIGHT SECTION: Registration Form */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-12 relative z-10">
        {/* Mobile Header Logo */}
        <div className="lg:hidden flex items-center justify-between mb-8">
          <Logo variant="full" size="sm" href="/" onDarkBackground priority />
          <Link href="/login" className="text-xs font-semibold text-emerald-400 hover:underline">
            Log In
          </Link>
        </div>

        <div className="my-auto w-full max-w-md mx-auto space-y-8 animate-fade-in-up">
          {/* Title Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Create an account</h2>
            <p className="text-sm text-slate-400">Enter your details to join TripNizer today.</p>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium text-rose-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                variant="dark"
                label="Full Name"
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User className="w-4 h-4 text-slate-400" />}
                required
              />

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

              <Input
                variant="dark"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
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

              {/* Grouped DOB & Gender Fields (2 Columns on Desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  variant="dark"
                  label="Date of Birth"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  icon={<Calendar className="w-4 h-4 text-slate-400" />}
                  className="[color-scheme:dark]"
                  required
                />

                <div className="w-full space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Gender
                  </label>
                  <div className="relative flex items-center">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10" />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-12 bg-slate-950 border border-slate-800 text-white text-sm sm:text-base rounded-2xl pl-11 pr-10 transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none truncate"
                      required
                    >
                      <option value="" disabled className="bg-slate-900 text-slate-500">
                        Select Gender
                      </option>
                      <option value="Male" className="bg-slate-900 text-white">
                        Male
                      </option>
                      <option value="Female" className="bg-slate-900 text-white">
                        Female
                      </option>
                      <option value="Other" className="bg-slate-900 text-white">
                        Other
                      </option>
                      <option value="Prefer not to say" className="bg-slate-900 text-white">
                        Prefer not to say
                      </option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10" />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                size="lg"
                className="mt-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm py-4 shadow-lg shadow-emerald-500/20 rounded-2xl active:scale-[0.99] transition-all"
              >
                Create Account
              </Button>
            </form>
          </div>

          {/* Footer Login Link */}
          <div className="text-center text-xs text-slate-400">
            Already have a TripNizer account?{' '}
            <Link href="/login" className="text-emerald-400 font-bold hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
