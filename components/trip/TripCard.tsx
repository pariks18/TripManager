'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, ArrowRight, MoreVertical, Trash2, Settings, Edit3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { TripSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface TripCardProps {
  trip: TripSummary;
  currentUserId?: string;
  onRename?: (trip: TripSummary) => void;
  onSettings?: (trip: TripSummary) => void;
  onDelete?: (trip: TripSummary) => void;
}

export const TripCard: React.FC<TripCardProps> = React.memo(({
  trip,
  currentUserId,
  onRename,
  onSettings,
  onDelete,
}) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isNetPositive = trip.userBalance > 0;
  const isNetNegative = trip.userBalance < 0;

  const isHost =
    currentUserId &&
    (trip.createdById === currentUserId ||
      trip.members.some((m) => m.userId === currentUserId && m.role === 'ADMIN'));

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleCardClick = () => {
    router.push(`/dashboard/trip/${trip.id}`);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onRename) {
      onRename(trip);
    } else {
      router.push(`/dashboard/trip/${trip.id}`);
    }
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onSettings) {
      onSettings(trip);
    } else {
      router.push(`/dashboard/trip/${trip.id}`);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete(trip);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative overflow-hidden group cursor-pointer bg-[#07251b]/80 hover:bg-[#093023]/95 border border-emerald-500/20 hover:border-emerald-400/40 backdrop-blur-xl shadow-xl rounded-3xl p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/50 hover:-translate-y-0.5"
    >
      {/* Soft Ambient Glow Effect */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top bar: Name & Trip Code + 3-Dot Options Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 tracking-tight">
              {trip.name}
            </h3>
            {trip.description ? (
              <p className="text-xs text-slate-300/80 line-clamp-1 mt-0.5 font-medium">{trip.description}</p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">
                Code: <span className="font-mono font-bold tracking-wider text-emerald-400">{trip.code}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {typeof trip.unreadCount === 'number' && trip.unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-black min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-[#07251b] shadow-sm animate-pulse" title={`${trip.unreadCount} unread messages`}>
                {trip.unreadCount}
              </span>
            )}

            <span className="bg-emerald-950/80 group-hover:bg-emerald-900/90 text-emerald-300 text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl border border-emerald-500/30 transition-colors">
              {trip.code}
            </span>

            {/* 3-Dot Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={toggleMenu}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-900/50 transition-all cursor-pointer flex items-center justify-center shrink-0"
                title="Trip options"
              >
                <MoreVertical className="w-4 h-4 shrink-0" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-8 w-44 bg-[#092d21] rounded-2xl shadow-2xl border border-emerald-500/30 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={handleRename}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-800/50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Rename Trip</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSettings}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-800/50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Trip Settings</span>
                  </button>

                  {isHost && (
                    <>
                      <div className="my-1 border-t border-emerald-900/60" />
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Delete Trip</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Stats Grid */}
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="bg-[#051c14]/70 rounded-2xl p-3 border border-emerald-900/40">
            <span className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-wider block">Total Spent</span>
            <span className="text-base font-black text-white mt-0.5 block truncate">
              {formatCurrency(trip.totalExpense, trip.currency)}
            </span>
          </div>

          <div className="bg-[#051c14]/70 rounded-2xl p-3 border border-emerald-900/40">
            <span className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-wider block">Your Balance</span>
            <span
              className={`text-base font-black mt-0.5 block truncate ${
                isNetPositive
                  ? 'text-emerald-400'
                  : isNetNegative
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {trip.userBalance === 0 ? 'Settled 🎉' : formatCurrency(trip.userBalance, trip.currency)}
            </span>
          </div>
        </div>

        {/* Footer: Member avatars & CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-emerald-900/40 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <div className="flex -space-x-2 overflow-hidden shrink-0">
              {trip.members.slice(0, 4).map((m) => (
                <Avatar key={m.id} name={m.user.name} size="sm" className="ring-2 ring-[#07251b] shrink-0" />
              ))}
            </div>
            {trip.members.length > 4 && (
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-300 bg-emerald-900/60 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 border border-emerald-700/50">
                +{trip.members.length - 4}
              </span>
            )}
            <span className="text-[11px] sm:text-xs text-slate-300/80 font-medium truncate">
              {trip.members.length} member{trip.members.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0">
            View Trip <ArrowRight className="w-3.5 h-3.5 ml-1 shrink-0 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
});
