'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface EndTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  onTripEnded: () => void;
}

export const EndTripModal: React.FC<EndTripModalProps> = ({
  isOpen,
  onClose,
  tripId,
  tripName,
  onTripEnded,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEndTrip = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to end trip');
      }

      showToast(`Trip "${tripName}" has been ended successfully. Moved to final settlement.`, 'success');
      onTripEnded();
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to end trip';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="End Trip?"
    >
      <div className="space-y-5 py-1">
        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs text-amber-950">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            End Trip for "{tripName}"?
          </div>
          <p className="text-amber-800 leading-relaxed font-medium">
            Are you sure you want to end this trip? After ending the trip, no new Advance Credit can be added and the trip will move to final settlement.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 font-medium">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} size="sm">
            Cancel
          </Button>
          <Button
            onClick={handleEndTrip}
            disabled={isSubmitting}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Ending Trip...
              </>
            ) : (
              'End Trip'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
