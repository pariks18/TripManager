'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ShieldCheck, AlertCircle, RefreshCw, Mail, HelpCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRecoveryEmailVerified?: boolean;
  userRecoveryEmail?: string | null;
  onOpenRecoveryEmailModal: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isRecoveryEmailVerified = false,
  userRecoveryEmail,
  onOpenRecoveryEmailModal,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [view, setView] = useState<'NORMAL_CHANGE' | 'FORGOT_PASSWORD_CONFIRM' | 'FORGOT_PASSWORD_VERIFY'>('NORMAL_CHANGE');
  
  // Normal change state
  const [currentPassword, setCurrentPassword] = useState('');
  
  // Reset state
  const [targetEmailChoice, setTargetEmailChoice] = useState<'PRIMARY' | 'RECOVERY'>('PRIMARY');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  useEffect(() => {
    setView('NORMAL_CHANGE');
    setCurrentPassword('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setDebugOtp(null);
    setTargetEmailChoice(isRecoveryEmailVerified && userRecoveryEmail ? 'RECOVERY' : 'PRIMARY');
  }, [isOpen, isRecoveryEmailVerified, userRecoveryEmail]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleNormalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/user/security/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      showToast(data.message || '✓ Password updated successfully', 'success', 'Password Updated');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResetOtp = async () => {
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/user/password/reset-request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: targetEmailChoice }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send password reset code');

      setMaskedEmail(data.maskedEmail || 'your email');
      if (data.debugOtp) setDebugOtp(data.debugOtp);

      showToast(data.message || `✓ Password reset code sent to ${data.maskedEmail}`, 'info', 'Code Sent');
      setView('FORGOT_PASSWORD_VERIFY');
      setCooldown(60);
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error', 'Request Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/user/password/reset-with-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      showToast(data.message || '✓ Password reset successfully!', 'success', 'Password Reset');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error', 'Password Reset Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={view === 'NORMAL_CHANGE' ? 'Change Password' : 'Password Recovery'}
    >
      {view === 'NORMAL_CHANGE' ? (
        <form onSubmit={handleNormalSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            type="password"
            label="Current Password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <Input
            type="password"
            label="New Password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setError('');
                setView('FORGOT_PASSWORD_CONFIRM');
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Forgot Password?
            </button>
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
              Update Password
            </Button>
          </div>
        </form>
      ) : view === 'FORGOT_PASSWORD_CONFIRM' ? (
        <div className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-purple-50/80 border border-purple-200/80 rounded-2xl space-y-2 text-xs text-purple-950">
            <div className="flex items-center gap-1.5 font-bold text-purple-900">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Choose Destination Email for Verification Code</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Select which email address you would like us to send the 6-digit password reset code to:
            </p>

            <div className="space-y-2 pt-1">
              <label
                onClick={() => setTargetEmailChoice('PRIMARY')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  targetEmailChoice === 'PRIMARY'
                    ? 'bg-purple-100/90 border-purple-400 font-bold text-purple-950 shadow-sm'
                    : 'bg-white/80 border-purple-200 text-purple-900 hover:bg-purple-100/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="text-xs block">Primary Login Email</span>
                  </div>
                </div>
                {targetEmailChoice === 'PRIMARY' && <CheckCircle2 className="w-4 h-4 text-purple-700" />}
              </label>

              {isRecoveryEmailVerified && userRecoveryEmail ? (
                <label
                  onClick={() => setTargetEmailChoice('RECOVERY')}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    targetEmailChoice === 'RECOVERY'
                      ? 'bg-purple-100/90 border-purple-400 font-bold text-purple-950 shadow-sm'
                      : 'bg-white/80 border-purple-200 text-purple-900 hover:bg-purple-100/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="text-xs block">Recovery Email ({userRecoveryEmail})</span>
                    </div>
                  </div>
                  {targetEmailChoice === 'RECOVERY' && <CheckCircle2 className="w-4 h-4 text-purple-700" />}
                </label>
              ) : (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center justify-between">
                  <span>No recovery email verified.</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecoveryEmailModal();
                    }}
                    className="font-bold underline hover:text-amber-950"
                  >
                    Add Recovery Email
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setView('NORMAL_CHANGE')}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <Button
              type="button"
              onClick={handleRequestResetOtp}
              isLoading={isLoading}
              className="flex-1 text-xs font-bold py-3"
            >
              Send Verification Code
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1 text-xs text-emerald-950">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Enter verification code sent to {maskedEmail}</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Enter the 6-digit code and your new password.
            </p>
          </div>

          {debugOtp && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-mono text-amber-800 text-center">
              Dev Mode Helper — Reset Code: <strong>{debugOtp}</strong>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-center tracking-[0.4em] text-2xl font-mono font-black rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
              required
            />
          </div>

          <Input
            type="password"
            label="New Password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            {cooldown > 0 ? (
              <span className="text-[11px] font-bold text-slate-400">
                Resend code in {cooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestResetOtp}
                className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Resend Code
              </button>
            )}
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
              Reset Password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
