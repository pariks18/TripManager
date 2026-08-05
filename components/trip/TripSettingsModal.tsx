'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Settings, ShieldCheck, ShieldOff, PiggyBank, Check, Sparkles, Info } from 'lucide-react';

interface TripSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  currentApprovalMode: boolean;
  currentBudget?: number | null;
  onSettingsUpdated: () => void;
}

export const TripSettingsModal: React.FC<TripSettingsModalProps> = ({
  isOpen,
  onClose,
  tripId,
  currency,
  currentApprovalMode,
  currentBudget,
  onSettingsUpdated,
}) => {
  const [approvalMode, setApprovalMode] = useState<boolean>(currentApprovalMode);
  const [budgetValue, setBudgetValue] = useState<string>(
    currentBudget ? currentBudget.toString() : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setApprovalMode(currentApprovalMode);
    setBudgetValue(currentBudget ? currentBudget.toString() : '');
    setError('');
    setSuccessMsg('');
  }, [currentApprovalMode, currentBudget, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalMode,
          budget: budgetValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update trip settings');
      }

      setSuccessMsg('Settings updated successfully!');
      onSettingsUpdated();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trip Settings & Controls">
      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Setting 1: Expense Verification Toggle */}
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
                  Expense Verification Workflow
                </h4>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    approvalMode
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  {approvalMode ? 'Verification Enabled' : 'Verification Disabled'}
                </span>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={approvalMode}
              onClick={() => setApprovalMode(!approvalMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
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

          <div
            className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1.5 transition-all ${
              approvalMode
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {approvalMode
                    ? 'Enabled (Approval Required):'
                    : 'Disabled (Instant Auto-Approval):'}
                </p>
                <p className="mt-0.5 font-normal">
                  {approvalMode
                    ? 'Every expense added by a member remains Pending until verified by the Super Host/Admin. Only approved expenses are included in the trip balance and split among members.'
                    : 'Expenses are automatically added and instantly split among all members without requiring any approval.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Setting 2: Trip Budget */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <PiggyBank className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                Total Trip Budget ({currency})
              </h4>
              <p className="text-[11px] text-slate-500">Monitor overspending with alerts</p>
            </div>
          </div>

          <div>
            <input
              type="number"
              step="any"
              placeholder="e.g. 50000 (Leave blank for unlimited)"
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 text-base font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Save Trip Settings
          </Button>
        </div>
      </form>
    </Modal>
  );
};
