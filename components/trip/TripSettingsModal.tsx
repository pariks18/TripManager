'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Settings, ShieldCheck, ShieldOff, PiggyBank, Check, Sparkles, Info, Wallet, FileCheck2 } from 'lucide-react';

interface TripSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  currentApprovalMode: boolean;
  currentBudget?: number | null;
  currentAdvanceTarget?: number | null;
  currentRequireVerification?: boolean;
  onSettingsUpdated: () => void;
}

export const TripSettingsModal: React.FC<TripSettingsModalProps> = ({
  isOpen,
  onClose,
  tripId,
  currency,
  currentApprovalMode,
  currentBudget,
  currentAdvanceTarget,
  currentRequireVerification = true,
  onSettingsUpdated,
}) => {
  const [approvalMode, setApprovalMode] = useState<boolean>(currentApprovalMode);
  const [budgetValue, setBudgetValue] = useState<string>(
    currentBudget ? currentBudget.toString() : ''
  );
  const [advanceTargetValue, setAdvanceTargetValue] = useState<string>(
    currentAdvanceTarget ? currentAdvanceTarget.toString() : ''
  );
  const [requireVerification, setRequireVerification] = useState<boolean>(currentRequireVerification);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setApprovalMode(currentApprovalMode);
    setBudgetValue(currentBudget ? currentBudget.toString() : '');
    setAdvanceTargetValue(currentAdvanceTarget ? currentAdvanceTarget.toString() : '');
    setRequireVerification(currentRequireVerification);
    setError('');
    setSuccessMsg('');
  }, [currentApprovalMode, currentBudget, currentAdvanceTarget, currentRequireVerification, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      // 1. Save main trip settings
      const resMain = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalMode,
          budget: budgetValue,
        }),
      });

      if (!resMain.ok) {
        const dataMain = await resMain.json();
        throw new Error(dataMain.error || 'Failed to update trip settings');
      }

      // 2. Save Advance Fund & Verification settings
      const resAdvance = await fetch(`/api/trips/${tripId}/advance/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advanceTargetPerMember: advanceTargetValue ? parseFloat(advanceTargetValue) : null,
          requireAdvanceVerification: requireVerification,
        }),
      });

      if (!resAdvance.ok) {
        const dataAdvance = await resAdvance.json();
        throw new Error(dataAdvance.error || 'Failed to update advance fund settings');
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
                    ? 'Every expense added by a member remains Pending until verified by the Super Host/Admin.'
                    : 'Expenses are automatically added and instantly split among all members.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Setting 2: Advance Fund Target & Verification Toggle */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Wallet className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                Advance Trip Fund & UTR Verification
              </h4>
              <p className="text-[11px] text-slate-500">Collect advance pool before trip starts</p>
            </div>
          </div>

          {/* Advance Target Per Member Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Advance Per Member ({currency})
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 5000 (Target advance amount)"
              value={advanceTargetValue}
              onChange={(e) => setAdvanceTargetValue(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl p-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* UTR & Screenshot Verification Toggle Switch */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                UTR & Screenshot Verification
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {requireVerification
                  ? 'Members must submit UTR ID & Screenshot proof'
                  : 'Simple Mode: Members tap "I\'ve Paid" without mandatory UTR/Screenshot'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={requireVerification}
              onClick={() => setRequireVerification(!requireVerification)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                requireVerification ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  requireVerification ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Setting 3: Trip Budget */}
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
