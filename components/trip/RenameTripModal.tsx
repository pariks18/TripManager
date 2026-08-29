'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Edit3 } from 'lucide-react';

interface RenameTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currentName: string;
  onSuccess: () => void;
}

export const RenameTripModal: React.FC<RenameTripModalProps> = ({
  isOpen,
  onClose,
  tripId,
  currentName,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(currentName);
    setError('');
  }, [currentName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Trip name cannot be empty');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rename trip');

      showToast('✓ Trip renamed successfully', 'success', 'Trip Renamed');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to rename trip');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename Trip" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Trip Name <span className="text-rose-500">*</span>
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Puri Summer Trip"
            required
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} className="font-bold text-xs">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};
