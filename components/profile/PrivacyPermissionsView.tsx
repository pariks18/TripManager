'use client';

import React from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface PrivacyPermissionsViewProps {
  onBack: () => void;
  onNavigateDocuments: () => void;
}

export const PrivacyPermissionsView: React.FC<PrivacyPermissionsViewProps> = ({
  onBack,
  onNavigateDocuments,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 apple-shadow transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>
        <h2 className="text-sm font-extrabold text-slate-900">Privacy & Permissions</h2>
        <div className="w-16" />
      </div>

      {/* Hero Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 apple-shadow space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold">Privacy & Document Protection</h3>
            <p className="text-xs text-slate-300">Strict access boundary policies for your profile</p>
          </div>
        </div>
      </div>

      {/* Permission Cards */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
          Document Access Policy
        </h3>

        <div className="space-y-3 text-xs">
          {/* Item 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Who can view your uploaded ID proofs?</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Only <strong>you</strong> and the authorized <strong>Super Host / Admin</strong> of a trip you have joined can access your ID proofs for hotel check-in and rental bookings.
            </p>
          </div>

          {/* Item 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <EyeOff className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Zero Access for Regular Trip Members</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Normal trip members are strictly blocked from seeing or downloading your private document photos or ID numbers.
            </p>
          </div>

          {/* Item 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Single Profile Repository</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Documents are stored once in your personal profile. You do not need to re-upload documents for every new trip you join.
            </p>
          </div>
        </div>
      </div>

      {/* Document Control Actions */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
          Manage Uploaded Documents
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          You have full authority to delete any document from your profile at any time. Removing a document revokes host access immediately.
        </p>

        <button
          onClick={onNavigateDocuments}
          className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-rose-600" /> Go to Documents to Manage or Delete
        </button>
      </div>
    </div>
  );
};
