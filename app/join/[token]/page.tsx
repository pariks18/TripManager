'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Compass,
  Clock
} from 'lucide-react';

interface PublicTripInfo {
  id: string;
  name: string;
  code: string;
  startDate?: string;
  endDate?: string;
  currency: string;
  memberCount: number;
  hostName: string;
}

export default function JoinTripPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [status, setStatus] = useState<string>('LOADING');
  const [message, setMessage] = useState<string>('');
  const [trip, setTrip] = useState<PublicTripInfo | null>(null);
  const [approvalMode, setApprovalMode] = useState<boolean>(false);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [joinedTripId, setJoinedTripId] = useState<string>('');

  useEffect(() => {
    if (token) {
      fetchInviteDetails();
    }
  }, [token]);

  const fetchInviteDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/join/${token}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus('ERROR');
        setMessage(data.error || 'Invalid invite link.');
        return;
      }

      setStatus(data.status);
      if (data.message) setMessage(data.message);

      if (data.status === 'OK') {
        setTrip(data.trip);
        setApprovalMode(data.approvalMode);
        setIsMember(data.isMember);
        setIsPending(data.isPending);
        setIsHost(data.isHost);
        if (data.trip?.id) setJoinedTripId(data.trip.id);
      }
    } catch (err: any) {
      setStatus('ERROR');
      setMessage(err.message || 'Failed to load invite link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsJoining(true);
    setMessage('');

    try {
      const res = await fetch(`/api/join/${token}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.status === 401 || data.code === 'UNAUTHORIZED') {
        // User not logged in -> redirect to login with returnUrl
        const currentPath = `/join/${token}`;
        router.push(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join trip');
      }

      if (data.status === 'ALREADY_MEMBER') {
        setIsMember(true);
        setJoinedTripId(data.tripId);
        setMessage(data.message);
      } else if (data.status === 'ALREADY_PENDING') {
        setIsPending(true);
        setJoinedTripId(data.tripId);
        setMessage(data.message);
      } else if (data.status === 'REQUEST_SENT') {
        setIsPending(true);
        setJoinedTripId(data.tripId);
        setMessage(data.message);
      } else if (data.status === 'JOINED') {
        setIsMember(true);
        setJoinedTripId(data.tripId);
        setMessage(data.message);
        setTimeout(() => {
          router.push(`/dashboard/trip/${data.tripId}`);
        }, 1200);
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return 'Flexible Dates';
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!end) return s;
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} - ${e}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center font-black text-slate-950 text-lg shadow-md shadow-emerald-500/20">
            TN
          </div>
          <span className="text-xl font-black tracking-tight text-white">TripNizer</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="relative z-10 my-auto w-full max-w-md mx-auto animate-fade-in-up">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          {isLoading ? (
            <div className="py-12 space-y-3">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 animate-spin">
                <Compass className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-400">Loading trip invite...</p>
            </div>
          ) : status === 'INVALID_TOKEN' ? (
            /* Invalid Token */
            <div className="space-y-5 py-4">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-white">Invalid Invite Link</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This invite link is no longer valid or has expired. Please ask the trip organizer for a new invite link.
                </p>
              </div>
              <Link href="/dashboard" className="block pt-2">
                <Button fullWidth size="lg" className="bg-slate-800 hover:bg-slate-700 text-white font-bold">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : status === 'INVITE_DISABLED' ? (
            /* Disabled Link */
            <div className="space-y-5 py-4">
              <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-white">Invite Link Disabled</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This invite link has been turned off by the host of <strong className="text-slate-200">{message || 'this trip'}</strong>.
                </p>
              </div>
              <Link href="/dashboard" className="block pt-2">
                <Button fullWidth size="lg" className="bg-slate-800 hover:bg-slate-700 text-white font-bold">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : trip ? (
            /* Valid Trip Invite Card */
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>You've Been Invited!</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                  {trip.name}
                </h1>
                <p className="text-xs text-slate-400">
                  Organized by <strong className="text-emerald-400">{trip.hostName}</strong>
                </p>
              </div>

              {/* Trip Info Pills */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" /> Dates
                  </span>
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {formatDateRange(trip.startDate, trip.endDate)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-400" /> Members
                  </span>
                  <p className="text-xs font-bold text-slate-200">
                    {trip.memberCount} {trip.memberCount === 1 ? 'Person' : 'People'}
                  </p>
                </div>
              </div>

              {/* Error or Status Messages */}
              {message && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-medium text-emerald-300 flex items-center justify-center gap-2 text-left">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>{message}</div>
                </div>
              )}

              {/* Actions */}
              {isMember ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> You're already a member of this trip.
                  </p>
                  <Button
                    onClick={() => router.push(`/dashboard/trip/${joinedTripId || trip.id}`)}
                    fullWidth
                    size="lg"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20"
                  >
                    Open Trip Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              ) : isPending ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Your join request is pending host approval.</span>
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    fullWidth
                    size="lg"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleJoin}
                    isLoading={isJoining}
                    fullWidth
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm py-4 shadow-lg shadow-emerald-500/20 rounded-2xl active:scale-[0.99] transition-all"
                  >
                    {approvalMode ? 'Request to Join Trip' : 'Join Trip Now'}
                  </Button>

                  {approvalMode && (
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Note: The host has enabled approval for this trip. Your request will be sent to the host.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p className="text-xs text-slate-400">{message || 'This trip is no longer available.'}</p>
              <Link href="/dashboard" className="block">
                <Button fullWidth size="lg" className="bg-slate-800 hover:bg-slate-700 text-white font-bold">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-md mx-auto text-center py-4 text-[11px] text-slate-500">
        TripNizer • Group Travel & Expense Management
      </footer>
    </div>
  );
}
