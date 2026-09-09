'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { UserPlus, Loader2 } from 'lucide-react';
import { TripMemberDetail } from '@/types';

interface AddUnjoinedMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onMemberAdded: (member: TripMemberDetail) => void;
}

export const AddUnjoinedMemberModal: React.FC<AddUnjoinedMemberModalProps> = ({
  isOpen,
  onClose,
  tripId,
  onMemberAdded,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/trips/${tripId}/unjoined-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          mobile: mobile.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add unjoined participant');

      showToast(`${name.trim()} added as an unjoined participant`, 'success');
      onMemberAdded(data.member);
      setName('');
      setEmail('');
      setMobile('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add unjoined participant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Unjoined Participant">
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <p className="text-xs text-slate-500 font-medium">
          Add someone participating in this trip who hasn't joined the app yet. They will be available for expense splitting and settlements.
        </p>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Participant Name <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Rohit Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Email (Optional)
          </label>
          <Input
            type="email"
            placeholder="rohit@example.com (used for linking later)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Mobile Number (Optional)
          </label>
          <Input
            type="tel"
            placeholder="+91 9876543210"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>

        <div className="pt-3 flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || isLoading} className="flex-1">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Participant'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
