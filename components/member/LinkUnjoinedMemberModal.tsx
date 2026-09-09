'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Link2, Loader2 } from 'lucide-react';
import { TripMemberDetail } from '@/types';

interface LinkUnjoinedMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  unjoinedMember: TripMemberDetail | null;
  onMemberLinked: () => void;
}

export const LinkUnjoinedMemberModal: React.FC<LinkUnjoinedMemberModalProps> = ({
  isOpen,
  onClose,
  tripId,
  unjoinedMember,
  onMemberLinked,
}) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!unjoinedMember) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/trips/${tripId}/unjoined-members/${unjoinedMember.userId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registeredUserEmail: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to link member');

      showToast(`Linked ${unjoinedMember.user.name} to registered account successfully`, 'success');
      onMemberLinked();
      setEmail('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to link member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Link "${unjoinedMember.user.name}" to App Account`}>
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <p className="text-xs text-slate-500 font-medium">
          When <strong className="text-slate-800">{unjoinedMember.user.name}</strong> joins the app, enter their registered email address below to connect all existing trip expenses and settlements to their user account.
        </p>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Registered User Email <span className="text-rose-500">*</span>
          </label>
          <Input
            type="email"
            placeholder="rohit@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="pt-3 flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={!email.trim() || isLoading} className="flex-1">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Link Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
