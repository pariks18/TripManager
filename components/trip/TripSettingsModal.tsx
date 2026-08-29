'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { TripSummary } from '@/types';
import {
  Settings,
  ShieldCheck,
  ShieldOff,
  PiggyBank,
  Check,
  Calendar,
  Users,
  Copy,
  Trash2,
  AlertTriangle,
  Info,
  DollarSign,
  Edit3,
} from 'lucide-react';

interface TripSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripSummary;
  currentUserId: string;
  onSettingsUpdated: () => void;
  onDeleteTrip?: (trip: TripSummary) => void;
}

export const TripSettingsModal: React.FC<TripSettingsModalProps> = ({
  isOpen,
  onClose,
  trip,
  currentUserId,
  onSettingsUpdated,
  onDeleteTrip,
}) => {
  const { showToast } = useToast();

  const [name, setName] = useState(trip.name || '');
  const [startDate, setStartDate] = useState(
    trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : ''
  );
  const [budgetValue, setBudgetValue] = useState(trip.budget ? trip.budget.toString() : '');
  const [currency, setCurrency] = useState(trip.currency || 'INR');
  const [approvalMode, setApprovalMode] = useState<boolean>(trip.approvalMode || false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isHost =
    trip.createdById === currentUserId ||
    trip.members.some((m) => m.userId === currentUserId && m.role === 'ADMIN');

  useEffect(() => {
    setName(trip.name || '');
    setStartDate(trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '');
    setEndDate(trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '');
    setBudgetValue(trip.budget ? trip.budget.toString() : '');
    setCurrency(trip.currency || 'INR');
    setApprovalMode(trip.approvalMode || false);
    setError('');
    setShowConfirmDelete(false);
  }, [trip, isOpen]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trip.code);
    setCopiedCode(true);
    showToast('✓ Join code copied to clipboard', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Trip name cannot be empty');
      return;
    }
    if (!startDate) {
      setError('Start date is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          startDate,
          endDate: endDate || null,
          budget: budgetValue,
          currency,
          approvalMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update trip settings');

      showToast('✓ Trip settings saved successfully', 'success', 'Settings Updated');
      onSettingsUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trip Settings & Controls" maxWidth="max-w-2xl">
      <form onSubmit={handleSaveSettings} className="space-y-5 py-1">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* 1. Trip Name */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
          <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
            Trip Name <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Goa Trip 2026"
            required
          />
        </div>

        {/* 2. Trip Dates (Start Date Required, End Date Optional / Extensible) */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              Trip Dates & Duration
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600">
                  End Date <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {endDate && (
                  <button
                    type="button"
                    onClick={() => setEndDate('')}
                    className="text-[10px] text-rose-600 hover:underline font-bold"
                  >
                    Remove End Date
                  </button>
                )}
              </div>
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            End date is optional so you can easily extend or update the trip schedule anytime.
          </p>
        </div>

        {/* 3. Budget & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-amber-600 shrink-0" />
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Total Budget
              </label>
            </div>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 50000 (Optional)"
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value)}
            />
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Currency
              </label>
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl p-2.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED (AED)</option>
            </select>
          </div>
        </div>

        {/* 4. Expense Verification Workflow Toggle */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl transition-colors ${
                  approvalMode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {approvalMode ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ShieldOff className="w-5 h-5 text-slate-500" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Expense Verification Mode
                </h4>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    approvalMode
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  {approvalMode ? 'Host Approval Required' : 'Instant Auto-Approve'}
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={approvalMode}
              onClick={() => setApprovalMode(!approvalMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                approvalMode ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  approvalMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {approvalMode
              ? 'When enabled, new member expenses remain pending until verified by the Host.'
              : 'When disabled, expenses are instantly split among members without review.'}
          </p>
        </div>

        {/* 5. Join Code Management */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              Trip Join Code
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
            <span className="font-mono text-lg font-black tracking-widest text-slate-900">
              {trip.code}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Share with members to join
            </span>
          </div>
        </div>

        {/* 6. Member Management Section */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Trip Members ({trip.members.length})
              </h4>
            </div>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {trip.members.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.user.name} size="sm" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{m.user.name}</span>
                    <span className="text-[10px] text-slate-400 block">{m.user.email}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    m.role === 'ADMIN' || trip.createdById === m.userId
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {trip.createdById === m.userId ? 'Host / Creator' : m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1 font-bold text-xs">
            Save Changes
          </Button>
        </div>

        {/* 7. Delete Trip Destructive Section at Bottom */}
        {isHost && onDeleteTrip && (
          <div className="pt-4 border-t border-slate-200">
            <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Destructive Actions</span>
                </div>
              </div>
              <p className="text-[11px] text-rose-600">
                Permanently delete this trip along with all expenses, settlements, memories, and member records.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteTrip(trip);
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Delete Trip
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
