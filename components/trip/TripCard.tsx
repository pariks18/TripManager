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
    <Card
      interactive
      onClick={handleCardClick}
      className="relative overflow-hidden group border-slate-100/80 hover:border-emerald-200 transition-all duration-300"
    >
      {/* Decorative gradient blur background */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 space-y-4">
        {/* Top bar: Name & Trip Code + 3-Dot Options Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
              {trip.name}
            </h3>
            {trip.description ? (
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{trip.description}</p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">
                Code: <span className="font-mono font-bold tracking-wider text-slate-700">{trip.code}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {typeof trip.unreadCount === 'number' && trip.unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-black min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse" title={`${trip.unreadCount} unread messages`}>
                {trip.unreadCount}
              </span>
            )}

            <span className="bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl border border-slate-200/60 transition-colors">
              {trip.code}
            </span>

            {/* 3-Dot Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={toggleMenu}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                title="Trip options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={handleRename}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Rename Trip</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSettings}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Trip Settings</span>
                  </button>

                  {isHost && (
                    <>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Spent</span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              {formatCurrency(trip.totalExpense, trip.currency)}
            </span>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Your Balance</span>
            <span
              className={`text-base font-extrabold mt-0.5 block ${
                isNetPositive
                  ? 'text-emerald-600'
                  : isNetNegative
                  ? 'text-rose-600'
                  : 'text-slate-600'
              }`}
            >
              {trip.userBalance === 0 ? 'Settled' : formatCurrency(trip.userBalance, trip.currency)}
            </span>
          </div>
        </div>

        {/* Footer: Member avatars & CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              {trip.members.slice(0, 4).map((m) => (
                <Avatar key={m.id} name={m.user.name} size="sm" className="ring-2 ring-white" />
              ))}
            </div>
            {trip.members.length > 4 && (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                +{trip.members.length - 4}
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium ml-1">
              {trip.members.length} member{trip.members.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            View Trip <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>
    </Card>
  );
});
