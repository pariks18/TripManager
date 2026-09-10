'use client';

import React, { useState } from 'react';
import { MemberBalance, UserSummary, TripRoleType } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';
import { FileText, UserX, Receipt, Crown, Shield, ShieldCheck, User, Link2, Wallet, Compass, Hotel, Vote } from 'lucide-react';
import { MemberDocumentsModal } from './MemberDocumentsModal';
import { RemoveMemberModal } from './RemoveMemberModal';
import { ManageRoleModal } from './ManageRoleModal';

interface MemberCardProps {
  memberBalance: MemberBalance;
  currency: string;
  isCurrentUser: boolean;
  isAdmin?: boolean; // Target member is ADMIN
  memberRoles?: TripRoleType[];
  isCurrentAdmin?: boolean; // Current session user is ADMIN/Organizer
  isPrimaryCreator?: boolean; // Target member created the trip
  tripId?: string;
  onMemberRemoved?: () => void;
  onViewBreakdown?: (user: UserSummary) => void;
  onRoleUpdated?: () => void;
  onLinkAccount?: (user: UserSummary) => void;
}

const ROLE_LABEL_MAP: Record<TripRoleType, { label: string; bg: string; text: string; border: string }> = {
  FUND_MANAGER: { label: 'Fund Mgr', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  EXPENSE_MANAGER: { label: 'Expense Mgr', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  TRIP_PLANNER: { label: 'Trip Planner', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  STAY_MANAGER: { label: 'Stay Mgr', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  TRAVEL_MANAGER: { label: 'Ticket Mgr', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  POLL_MANAGER: { label: 'Poll Mgr', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
};

export const MemberCard: React.FC<MemberCardProps> = React.memo(({
  memberBalance,
  currency,
  isCurrentUser,
  isAdmin = false,
  memberRoles = [],
  isCurrentAdmin = false,
  isPrimaryCreator = false,
  tripId,
  onMemberRemoved,
  onViewBreakdown,
  onRoleUpdated,
  onLinkAccount,
}) => {
  const { user, netBalance, paid, share } = memberBalance;
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const isUnjoined = user.isUnjoined || false;
  const getsBack = netBalance > 0.01;
  const owes = netBalance < -0.01;

  // Host (isCurrentAdmin) or self (isCurrentUser) can view financial breakdown details
  const canViewFinancials = isCurrentAdmin || isCurrentUser;

  // Super Host / Admin or self can view ID proof documents
  const canViewDocs = (isCurrentAdmin || isCurrentUser) && !isUnjoined && !!tripId;

  // Current session organizer can manage role if target is NOT self and NOT primary creator and NOT unjoined
  const canManageRole = isCurrentAdmin && !isCurrentUser && !isPrimaryCreator && !isUnjoined && !!tripId;

  // Current session organizer can remove member if target is NOT self and NOT primary creator
  const canRemoveMember = isCurrentAdmin && !isCurrentUser && !isPrimaryCreator && !!tripId;

  const currentRole: 'ADMIN' | 'MEMBER' = isAdmin || isPrimaryCreator ? 'ADMIN' : 'MEMBER';

  return (
    <>
      <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-100 apple-shadow flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Avatar name={user.name} size="md" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs sm:text-base font-bold text-slate-900 truncate max-w-[130px] sm:max-w-none">
                {user.name} {isCurrentUser ? '(You)' : ''}
              </h4>

              {/* Role Badges */}
              {isUnjoined ? (
                <span className="bg-amber-50 text-amber-800 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 shrink-0 flex items-center gap-0.5">
                  <UserX className="w-3 h-3 text-amber-600" /> Not joined
                </span>
              ) : isPrimaryCreator ? (
                <span className="bg-amber-50 text-amber-800 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 shrink-0 flex items-center gap-0.5">
                  <Crown className="w-3 h-3 text-amber-600" /> Primary Creator
                </span>
              ) : isAdmin ? (
                <span className="bg-emerald-50 text-emerald-800 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Organizer
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 shrink-0 flex items-center gap-0.5">
                  <User className="w-3 h-3 text-slate-400" /> Member
                </span>
              )}

              {/* Functional Role Badges */}
              {memberRoles.map((r) => {
                const style = ROLE_LABEL_MAP[r];
                if (!style) return null;
                return (
                  <span key={r} className={`${style.bg} ${style.text} ${style.border} text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0`}>
                    {style.label}
                  </span>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {canViewFinancials && (
                <p className="text-xs text-slate-500 font-medium">
                  Paid {formatCurrency(paid, currency)} • Share {formatCurrency(share, currency)}
                  {memberBalance.advanceCredit && memberBalance.advanceCredit > 0 ? (
                    <span className="ml-1 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60 inline-block">
                      Advance Credit +{formatCurrency(memberBalance.advanceCredit, currency)}
                    </span>
                  ) : null}
                </p>
              )}

              {isUnjoined && isCurrentAdmin && onLinkAccount && (
                <button
                  onClick={() => onLinkAccount(user)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="Link this participant to a registered account"
                >
                  <Link2 className="w-3 h-3 text-indigo-600" /> Link Account
                </button>
              )}

              {canViewDocs && (
                <button
                  onClick={() => setShowDocsModal(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                >
                  <FileText className="w-3 h-3 text-emerald-600" /> ID Proofs
                </button>
              )}

              {/* Manage Roles Action */}
              {canManageRole && (
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="Manage Member Roles & Permissions"
                >
                  <Shield className="w-3 h-3" /> Manage Roles
                </button>
              )}

              {canRemoveMember && (
                <button
                  onClick={() => setShowRemoveModal(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="Remove Member from Trip"
                >
                  <UserX className="w-3 h-3 text-rose-600" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right side action / status */}
        {canViewFinancials && (
          <div className="text-right shrink-0">
            {getsBack && (
              <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-2xl">
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">Gets back</span>
                <span className="text-xs font-black text-emerald-700 block">
                  +{formatCurrency(netBalance, currency).replace('+', '')}
                </span>
              </div>
            )}

            {owes && (
              <div className="bg-rose-50 border border-rose-200/80 px-3 py-1 rounded-2xl">
                <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider block">Owes</span>
                <span className="text-xs font-black text-rose-700 block">
                  {formatCurrency(netBalance, currency)}
                </span>
              </div>
            )}

            {!getsBack && !owes && (
              <div className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-2xl">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Settled</span>
                <span className="text-xs font-bold text-slate-700 block">{currency}0</span>
              </div>
            )}

            {onViewBreakdown && (
              <button
                onClick={() => onViewBreakdown(user)}
                className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer block ml-auto"
              >
                <Receipt className="w-3 h-3 text-emerald-600" /> Calculation
              </button>
            )}
          </div>
        )}
      </div>

      {showDocsModal && tripId && (
        <MemberDocumentsModal
          isOpen={showDocsModal}
          onClose={() => setShowDocsModal(false)}
          tripId={tripId}
          memberUserId={user.id}
          memberName={user.name}
        />
      )}

      {showRemoveModal && tripId && (
        <RemoveMemberModal
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          tripId={tripId}
          currency={currency}
          memberUserId={user.id}
          memberName={user.name}
          onSuccess={() => {
            if (onMemberRemoved) onMemberRemoved();
          }}
        />
      )}

      {showRoleModal && tripId && (
        <ManageRoleModal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          tripId={tripId}
          targetUserId={user.id}
          targetUserName={user.name}
          currentRole={currentRole}
          currentRoles={memberRoles}
          onSuccess={() => {
            if (onRoleUpdated) onRoleUpdated();
            if (onMemberRemoved) onMemberRemoved();
          }}
        />
      )}
    </>
  );
});
