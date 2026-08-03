'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Compass, FileText, Calendar, DollarSign } from 'lucide-react';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trip: any) => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Trip name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          currency,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create trip');

      setName('');
      setDescription('');
      onSuccess(data.trip);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Trip">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-600">
            {error}
          </div>
        )}

        <Input
          label="Trip Name"
          placeholder="e.g. Goa Beach Trip, Thailand 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<Compass className="w-4 h-4" />}
          required
        />

        <Input
          label="Description (Optional)"
          placeholder="e.g. Flight, stay and food split"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          icon={<FileText className="w-4 h-4" />}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-base rounded-2xl p-3.5 focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="₹">INR (₹)</option>
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
              <option value="฿">THB (฿)</option>
              <option value="S$">SGD (S$)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            Generate Trip & Code
          </Button>
        </div>
      </form>
    </Modal>
  );
};
