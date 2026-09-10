'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ShieldCheck, ShieldAlert, Loader2, Wallet, Receipt, Compass, Hotel, FileText, Vote, Check, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { TripRoleType } from '@/types';

interface ManageRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  targetUserId: string;
  targetUserName: string;
  currentRole: 'ADMIN' | 'MEMBER';
  currentRoles?: TripRoleType[];
  onSuccess?: () => void;
}

const GRANULAR_ROLES: { key: TripRoleType; title: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  {
    key: 'FUND_MANAGER',
    title: 'Fund Manager',
    desc: 'Review & approve Advance Credit contributions & fund management',
    icon: Wallet,
  },
  {
    key: 'EXPENSE_MANAGER',
    title: 'Expense Manager',
    desc: 'Add, edit, approve, and manage trip expenses',
    icon: Receipt,
  },
  {
    key: 'TRIP_PLANNER',
    title: 'Trip Planner',
    desc: 'Create, edit, and organize daily trip itinerary & schedule',
    icon: Compass,
  },
  {
    key: 'STAY_MANAGER',
    title: 'Stay Manager',
    desc: 'Manage hotel/accommodation details and available amenities',
    icon: Hotel,
  },
  {
    key: 'TRAVEL_MANAGER',
    title: 'Ticket / Travel Manager',
    desc: 'Manage travel tickets and member ID proof documents',
    icon: FileText,
  },
  {
    key: 'POLL_MANAGER',
    title: 'Poll / Comm Manager',
    desc: 'Create, manage, and close live trip polls & voting',
    icon: Vote,
  },
];

export const ManageRoleModal: React.FC<ManageRoleModalProps> = ({
  isOpen,
  onClose,
  tripId,
  targetUserId,
  targetUserName,
  currentRole,
  currentRoles = [],
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRoles, setActiveRoles] = useState<TripRoleType[]>(currentRoles);

  const isPromoting = currentRole === 'MEMBER';
  const targetPrimaryRole: 'ADMIN' | 'MEMBER' = isPromoting ? 'ADMIN' : 'MEMBER';

  const handleToggleRole = async (roleKey: TripRoleType) => {
    setIsSubmitting(true);
    const hasRole = activeRoles.includes(roleKey);
    const method = hasRole ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/trips/${tripId}/members/${targetUserId}/roles`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      const updatedRoles = hasRole
        ? activeRoles.filter((r) => r !== roleKey)
        : [...activeRoles, roleKey];

      setActiveRoles(updatedRoles);
      showToast(`Updated "${GRANULAR_ROLES.find(r => r.key === roleKey)?.title}" role`, 'success');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      showToast(error.message || 'Failed to update role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPrimaryRoleChange = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/members/${targetUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetPrimaryRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member role');

      showToast(data.message || 'Member primary role updated successfully', 'success');
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
      title={`Manage Roles - ${targetUserName}`}
    >
      <div className="space-y-5 py-1">
        {/* Header */}
        <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <Avatar name={targetUserName} size="md" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">{targetUserName}</h4>
            <span className="text-xs text-slate-500 font-medium">
              Primary Role: <span className="font-bold text-slate-800">{currentRole === 'ADMIN' ? 'Organizer / Host' : 'Member'}</span>
            </span>
          </div>
        </div>

        {/* Granular Management Roles Section */}
        <div className="space-y-2.5">
          <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Assigned Functional Roles
          </h5>
          <p className="text-xs text-slate-500 font-medium">
            Grant specific management powers for different features of the trip to this member.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {GRANULAR_ROLES.map((role) => {
              const Icon = role.icon;
              const isAssigned = activeRoles.includes(role.key);
              return (
                <button
                  key={role.key}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleToggleRole(role.key)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isAssigned
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl ${isAssigned ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">{role.title}</span>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isAssigned ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isAssigned ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {isAssigned ? 'Active' : 'Assign'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-2 leading-tight">
                    {role.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Role (Organizer) Change Section */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Primary Host Role
          </h5>
          {isPromoting ? (
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2 text-xs text-emerald-950">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Promote {targetUserName} to Organizer?
              </div>
              <p className="text-emerald-800 leading-relaxed font-medium">
                Organizers have full control over trip settings, member management, and financial overrides.
              </p>
              <Button
                onClick={handleConfirmPrimaryRoleChange}
                disabled={isSubmitting}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white mt-1"
              >
                Make Organizer
              </Button>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 space-y-2 text-xs text-rose-950">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Demote {targetUserName} to Member?
              </div>
              <p className="text-rose-800 leading-relaxed font-medium">
                {targetUserName} will lose primary organizer administrative status.
              </p>
              <Button
                onClick={handleConfirmPrimaryRoleChange}
                disabled={isSubmitting}
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white mt-1"
              >
                Demote to Member
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} size="sm">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
