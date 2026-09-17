'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Link2, Loader2, AlertTriangle, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';
import { TripMemberDetail } from '@/types';

interface LinkUnjoinedMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  unjoinedMember: TripMemberDetail | null;
  existingMembers?: TripMemberDetail[];
  onMemberLinked: () => void;
}

export const LinkUnjoinedMemberModal: React.FC<LinkUnjoinedMemberModalProps> = ({
  isOpen,
  onClose,
  tripId,
  unjoinedMember,
  existingMembers = [],
  onMemberLinked,
}) => {
  const { showToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [step, setStep] = useState<'SELECT' | 'CONFIRM'>('SELECT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter registered members in the trip
  const registeredTripMembers = existingMembers.filter(
    (m) => !m.isUnjoined && !m.user.isUnjoined && m.userId !== unjoinedMember?.userId
  );

  useEffect(() => {
    setSelectedUserId('');
    setCustomEmail('');
    setStep('SELECT');
    setError('');
  }, [isOpen, unjoinedMember]);

  if (!unjoinedMember) return null;

  const getTargetSummary = () => {
    if (selectedUserId && selectedUserId !== 'CUSTOM_EMAIL') {
      const found = registeredTripMembers.find((m) => m.userId === selectedUserId);
      if (found) {
        return {
          id: found.userId,
          name: found.user.name,
          email: found.user.email || 'Registered User',
        };
      }
    }
    if (customEmail.trim()) {
      return {
        id: undefined,
        name: customEmail.trim(),
        email: customEmail.trim(),
      };
    }
    return null;
  };

  const targetSummary = getTargetSummary();

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedUserId === 'CUSTOM_EMAIL' || (!selectedUserId && customEmail)) {
      if (!customEmail.trim() || !customEmail.includes('@')) {
        setError('Please enter a valid registered user email address.');
        return;
      }
    } else if (!selectedUserId) {
      setError('Please select a registered participant or enter an email address.');
      return;
    }

    setStep('CONFIRM');
  };

  const handleConfirmMerge = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const payload: { registeredUserId?: string; registeredUserEmail?: string } = {};

      if (selectedUserId && selectedUserId !== 'CUSTOM_EMAIL') {
        payload.registeredUserId = selectedUserId;
      } else if (customEmail.trim()) {
        payload.registeredUserEmail = customEmail.trim();
      } else {
        throw new Error('Please select a target registered user.');
      }

      const res = await fetch(`/api/trips/${tripId}/unjoined-members/${unjoinedMember.userId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to merge guest participant');

      const targetLabel = targetSummary?.name || 'registered user account';
      showToast(`✓ Merged ${unjoinedMember.user.name} into ${targetLabel} successfully`, 'success', 'User Merged');
      onMemberLinked();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to merge guest participant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'CONFIRM' ? 'Confirm Guest User Merge' : `Merge Guest User: ${unjoinedMember.user.name}`}
    >
      {error && (
        <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'SELECT' ? (
        <form onSubmit={handleProceedToConfirm} className="space-y-4 py-1">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Guest Participant
            </span>
            <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
              {unjoinedMember.user.name}
            </p>
            <p className="text-xs text-slate-500 font-medium pt-0.5">
              Select the registered user account that represents {unjoinedMember.user.name} after they created an account.
            </p>
          </div>

          {/* Registered Participants Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Merge into registered account <span className="text-rose-500">*</span>
            </label>

            {registeredTripMembers.length > 0 && (
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-2xl p-3 focus:outline-none focus:border-indigo-500 focus:bg-white mb-2"
              >
                <option value="">-- Select registered trip participant --</option>
                {registeredTripMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} {m.user.email ? `(${m.user.email})` : ''}
                  </option>
                ))}
                <option value="CUSTOM_EMAIL">✉ Or enter user email address...</option>
              </select>
            )}

            {/* Email input for user outside trip or custom selection */}
            {(registeredTripMembers.length === 0 || selectedUserId === 'CUSTOM_EMAIL') && (
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Registered User Email Address
                </label>
                <Input
                  type="email"
                  placeholder="e.g. amit@example.com"
                  value={customEmail}
                  onChange={(e) => {
                    setCustomEmail(e.target.value);
                    if (selectedUserId !== 'CUSTOM_EMAIL') setSelectedUserId('CUSTOM_EMAIL');
                    setError('');
                  }}
                  required
                />
              </div>
            )}
          </div>

          <div className="pt-3 flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedUserId && !customEmail.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>
      ) : (
        /* Step 2: Confirmation Dialog */
        <div className="space-y-4 py-1">
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Confirm Guest User Merge</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200/60 text-xs space-y-1.5">
              <p className="text-slate-800">
                <strong className="text-slate-900">{unjoinedMember.user.name}</strong> will be merged into{' '}
                <strong className="text-indigo-900">{targetSummary?.name}</strong> {targetSummary?.email ? `(${targetSummary.email})` : ''}.
              </p>
              <p className="text-slate-600 text-[11px]">
                Their existing expenses, expense splits, balances, payments/credits, and trip history will be transferred to{' '}
                <strong>{targetSummary?.name}</strong>.
              </p>
            </div>

            <p className="text-[11px] font-semibold text-amber-800">
              ⚠️ This action will reassign all historical data and remove {unjoinedMember.user.name} as a separate participant.
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('SELECT')}
              disabled={isLoading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleConfirmMerge}
              isLoading={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Confirm Merge
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

