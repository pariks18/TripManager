'use client';

import React, { useState } from 'react';
import { UserProfileDetail } from '@/types';
import { ChangePasswordModal } from './ChangePasswordModal';
import { RecoveryEmailModal } from './RecoveryEmailModal';
import { VerificationModal } from './VerificationModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  Trash2,
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
  const [isRecoveryEmailModalOpen, setIsRecoveryEmailModalOpen] = useState(false);
  const [isVerifyPrimaryEmailOpen, setIsVerifyPrimaryEmailOpen] = useState(false);
  const [isRemovingRecovery, setIsRemovingRecovery] = useState(false);

  const { showToast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleRecoveryEmailSuccess = async () => {
    window.location.reload();
  };

  const performRemoveRecoveryEmail = async () => {
    setIsRemovingRecovery(true);
    try {
      const res = await fetch('/api/user/recovery-email/remove', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove recovery email');
      }
      showToast('✓ Recovery email removed', 'info', 'Recovery Email');
      window.location.reload();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove recovery email', 'error', 'Error');
    } finally {
      setIsRemovingRecovery(false);
    }
  };

  const handlePrimaryEmailVerified = async () => {
    await onUpdateProfile({ isEmailVerified: true });
    window.location.reload();
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
              <p className="text-xs text-slate-300">Protected with Gmail OTP & Recovery Email</p>
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
          {/* Primary Login Email */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Primary Login Email</span>
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
                onClick={() => setIsVerifyPrimaryEmailOpen(true)}
                className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full border border-amber-200 transition-colors"
              >
                Verify Now
              </button>
            )}
          </div>

          {/* Recovery Email */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Recovery Email</span>
                <span className="text-[11px] text-slate-500">
                  {profile.recoveryEmail && profile.isRecoveryEmailVerified
                    ? profile.recoveryEmail
                    : profile.recoveryEmail
                    ? `${profile.recoveryEmail} (Pending Verification)`
                    : 'Not Added'}
                </span>
              </div>
            </div>

            {profile.isRecoveryEmailVerified && profile.recoveryEmail ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
                <button
                  type="button"
                  onClick={() => setIsRecoveryEmailModalOpen(true)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(true)}
                  disabled={isRemovingRecovery}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Remove Recovery Email"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : profile.recoveryEmail ? (
              <button
                type="button"
                onClick={() => setIsRecoveryEmailModalOpen(true)}
                className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full border border-amber-200 transition-colors"
              >
                Verify Now
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecoveryEmailModalOpen(true)}
                className="text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 px-3.5 py-1.5 rounded-full border border-blue-200 transition-colors"
              >
                Add Recovery Email
              </button>
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
                <span className="text-[11px] text-slate-400">
                  Update password or use Forgot Password recovery
                </span>
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
          isRecoveryEmailVerified={!!profile.isRecoveryEmailVerified}
          userRecoveryEmail={profile.recoveryEmail}
          onOpenRecoveryEmailModal={() => setIsRecoveryEmailModalOpen(true)}
          onSuccess={() => setIsPasswordModalOpen(false)}
        />
      )}

      {isRecoveryEmailModalOpen && (
        <RecoveryEmailModal
          isOpen={isRecoveryEmailModalOpen}
          onClose={() => setIsRecoveryEmailModalOpen(false)}
          currentRecoveryEmail={profile.recoveryEmail}
          onSuccess={handleRecoveryEmailSuccess}
        />
      )}

      {isVerifyPrimaryEmailOpen && (
        <VerificationModal
          isOpen={isVerifyPrimaryEmailOpen}
          onClose={() => setIsVerifyPrimaryEmailOpen(false)}
          targetEmail={profile.email || ''}
          onVerified={handlePrimaryEmailVerified}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Remove Recovery Email"
        message="Are you sure you want to remove your recovery email? You will not be able to recover your password if you forget it."
        confirmText="Remove Email"
        variant="danger"
        isLoading={isRemovingRecovery}
        onConfirm={performRemoveRecoveryEmail}
      />
    </div>
  );
};
