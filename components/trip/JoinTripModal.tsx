'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { KeyRound } from 'lucide-react';

interface JoinTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trip: any) => void;
}

export const JoinTripModal: React.FC<JoinTripModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a valid trip code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/trips/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join trip');

      setCode('');
      onSuccess(data.trip);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Existing Trip">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1">
            Trip Code
          </label>
          <Input
            placeholder="e.g. ABCD12"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            icon={<KeyRound className="w-4 h-4" />}
            maxLength={6}
            className="font-mono uppercase tracking-widest text-center text-lg font-bold"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Ask the trip organizer for the 6-character code.
          </p>
        </div>

        <div className="pt-2">
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Join Trip
          </Button>
        </div>
      </form>
    </Modal>
  );
};
