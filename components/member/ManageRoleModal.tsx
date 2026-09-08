'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ShieldCheck, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ManageRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  targetUserId: string;
  targetUserName: string;
  currentRole: 'ADMIN' | 'MEMBER';
  onSuccess?: () => void;
}

export const ManageRoleModal: React.FC<ManageRoleModalProps> = ({
  isOpen,
  onClose,
  tripId,
  targetUserId,
  targetUserName,
  currentRole,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPromoting = currentRole === 'MEMBER';
  const targetRole: 'ADMIN' | 'MEMBER' = isPromoting ? 'ADMIN' : 'MEMBER';

  const handleConfirmRoleChange = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/members/${targetUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member role');

      showToast(data.message || 'Member role updated successfully', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to update member role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPromoting ? 'Promote to Organizer' : 'Remove Organizer Role'}
    >
      <div className="space-y-5 py-1">
        <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <Avatar name={targetUserName} size="md" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">{targetUserName}</h4>
            <span className="text-xs text-slate-500 font-medium">
              Current Role: <span className="font-bold text-slate-800">{currentRole === 'ADMIN' ? 'Organizer' : 'Member'}</span>
            </span>
          </div>
        </div>

        {isPromoting ? (
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 space-y-2 text-xs text-emerald-950">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Promote {targetUserName} to Organizer?
            </div>
            <p className="text-emerald-800 leading-relaxed font-medium">
              Organizers can manage trip members, approve expenses, adjust trip budget/dates, and access host-level settlement controls.
            </p>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 space-y-2 text-xs text-rose-950">
            <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Remove Organizer Role from {targetUserName}?
            </div>
            <p className="text-rose-800 leading-relaxed font-medium">
              {targetUserName} will become a standard trip member and lose access to organizer administrative settings.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} size="sm">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRoleChange}
            disabled={isSubmitting}
            size="sm"
            className={isPromoting ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Updating...
              </>
            ) : isPromoting ? (
              'Confirm & Promote'
            ) : (
              'Confirm & Remove Role'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
