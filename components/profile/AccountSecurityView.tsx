'use client';

import React, { useState } from 'react';
import { UserProfileDetail } from '@/types';
import { ChangePasswordModal } from './ChangePasswordModal';
import { VerificationModal } from './VerificationModal';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Mail,
  Smartphone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface AccountSecurityViewProps {
  profile: UserProfileDetail;
  onBack: () => void;
  onUpdateProfile: (updatedData: Partial<UserProfileDetail>) => Promise<void>;
}

export const AccountSecurityView: React.FC<AccountSecurityViewProps> = ({
  profile,
  onBack,
  onUpdateProfile,
}) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [verificationType, setVerificationType] = useState<'EMAIL' | 'MOBILE' | null>(null);

  const handleVerifySuccess = async () => {
    if (verificationType === 'EMAIL') {
      await onUpdateProfile({ isEmailVerified: true });
    } else if (verificationType === 'MOBILE') {
      await onUpdateProfile({ isMobileVerified: true });
    }
    setVerificationType(null);
  };

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
        <h2 className="text-sm font-extrabold text-slate-900">Account & Security</h2>
        <div className="w-16" />
      </div>

      {/* Security Score Header Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 border border-slate-800 apple-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Account Security Center</h3>
              <p className="text-xs text-slate-300">Protected with TripSplit JWT Authentication</p>
            </div>
          </div>
          <span className="text-xs font-extrabold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full">
            Active
          </span>
        </div>
      </div>

      {/* Verification Status Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
          Verification Statuses
        </h3>

        <div className="space-y-3">
          {/* Email Verification */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Email Verification</span>
                <span className="text-[11px] text-slate-500">{profile.email}</span>
              </div>
            </div>

            {profile.isEmailVerified ? (
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setVerificationType('EMAIL')}
                className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full border border-amber-200 transition-colors"
              >
                Verify Now
              </button>
            )}
          </div>

          {/* Mobile Verification */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Mobile Verification</span>
                <span className="text-[11px] text-slate-500">{profile.mobile || 'No mobile added'}</span>
              </div>
            </div>

            {profile.isMobileVerified ? (
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : profile.mobile ? (
              <button
                type="button"
                onClick={() => setVerificationType('MOBILE')}
                className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full border border-amber-200 transition-colors"
              >
                Verify Now
              </button>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                Add Mobile First
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Security Actions Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
          Login & Password Security
        </h3>

        <div className="space-y-3">
          {/* Change Password */}
          <div
            onClick={() => setIsPasswordModalOpen(true)}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Change Password</span>
                <span className="text-[11px] text-slate-400">Update your account login password</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Session Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-200 text-slate-700 rounded-xl">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Active Session</span>
                <span className="text-[11px] text-slate-400">Secure HTTP-Only Cookie Token</span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isPasswordModalOpen && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          onSuccess={() => setIsPasswordModalOpen(false)}
        />
      )}

      {verificationType && (
        <VerificationModal
          isOpen={!!verificationType}
          onClose={() => setVerificationType(null)}
          targetType={verificationType}
          targetValue={verificationType === 'EMAIL' ? profile.email || '' : profile.mobile || ''}
          onVerified={handleVerifySuccess}
        />
      )}
    </div>
  );
};
