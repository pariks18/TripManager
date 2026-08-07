'use client';

import React, { useState } from 'react';
import { MemberBalance, UserSummary } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, User, FileText, UserX } from 'lucide-react';
import { MemberDocumentsModal } from './MemberDocumentsModal';
import { RemoveMemberModal } from './RemoveMemberModal';

interface MemberCardProps {
  memberBalance: MemberBalance;
  currency: string;
  isCurrentUser: boolean;
  isAdmin?: boolean;
  isCurrentAdmin?: boolean;
  tripId?: string;
  onMemberRemoved?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  memberBalance,
  currency,
  isCurrentUser,
  isAdmin = false,
  isCurrentAdmin = false,
  tripId,
  onMemberRemoved,
}) => {
  const { user, netBalance, paid, share } = memberBalance;
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const getsBack = netBalance > 0;
  const owes = netBalance < 0;

  // Super Host / Admin or self can view ID proof documents
  const canViewDocs = (isCurrentAdmin || isCurrentUser) && !!tripId;
  // Super Host / Admin can remove other members (excluding self & organizer)
  const canRemoveMember = isCurrentAdmin && !isAdmin && !isCurrentUser && !!tripId;

  return (
    <>
      <div className="bg-white rounded-3xl p-4 border border-slate-100 apple-shadow flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="md" />

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900">
                {user.name} {isCurrentUser ? '(You)' : ''}
              </h4>
              {isAdmin && (
                <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  Organizer
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-xs text-slate-400">
                Paid {formatCurrency(paid, currency)} • Share {formatCurrency(share, currency)}
              </p>
              {canViewDocs && (
                <button
                  onClick={() => setShowDocsModal(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-full transition-colors"
                >
                  <FileText className="w-3 h-3 text-emerald-600" /> ID Proofs
                </button>
              )}
              {canRemoveMember && (
                <button
                  onClick={() => setShowRemoveModal(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded-full transition-colors"
                  title="Remove Member from Trip"
                >
                  <UserX className="w-3 h-3 text-rose-600" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Color-coded Balance Pill */}
        <div className="text-right shrink-0">
          {getsBack && (
            <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-2xl">
              <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">Gets back</span>
              <span className="text-sm font-extrabold text-emerald-700 block">
                +{formatCurrency(netBalance, currency).replace('+', '')}
              </span>
            </div>
          )}

          {owes && (
            <div className="bg-rose-50 border border-rose-200/80 px-3 py-1.5 rounded-2xl">
              <span className="text-[11px] font-medium text-rose-600 uppercase tracking-wider block">Owes</span>
              <span className="text-sm font-extrabold text-rose-700 block">
                {formatCurrency(netBalance, currency)}
              </span>
            </div>
          )}

          {!getsBack && !owes && (
            <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-2xl">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Settled</span>
              <span className="text-sm font-bold text-slate-700 block">{currency}0</span>
            </div>
          )}
        </div>
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
    </>
  );
};

