'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { Wallet, AlertCircle, Info, Sparkles } from 'lucide-react';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  onSuccess: () => void;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({
  isOpen,
  onClose,
  tripId,
  currency,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid advance amount greater than zero.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/wallet/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit advance request');

      showToast(
        `✓ Advance request of ${formatCurrency(numAmount, currency)} submitted to Host for approval`,
        'success',
        'Request Submitted'
      );

      setAmount('');
      setNote('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message || 'Failed to submit advance request', 'error', 'Submission Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Personal Advance Money">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Advance Credit</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed font-medium">
            This advance money belongs exclusively to your <strong>Advance Credit</strong> balance. Once confirmed, your available credit will automatically absorb future trip expense shares!
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
            Advance Amount ({currency})
          </label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 1000.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xl font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
            Note / Reference (Optional)
          </label>
          <Input
            placeholder="e.g. Paid cash to Host, UPI reference number"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" isLoading={isLoading} className="flex-1 text-xs font-bold py-3">
            Submit Advance Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};
