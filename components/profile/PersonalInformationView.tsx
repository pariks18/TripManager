'use client';

import React, { useState } from 'react';
import { UserProfileDetail } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { VerificationModal } from './VerificationModal';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface PersonalInformationViewProps {
  profile: UserProfileDetail;
  onBack: () => void;
  onUpdateProfile: (updatedData: Partial<UserProfileDetail>) => Promise<void>;
}

type EditFieldKey = 'name' | 'email' | 'mobile' | 'dob' | 'gender' | null;

export const PersonalInformationView: React.FC<PersonalInformationViewProps> = ({
  profile,
  onBack,
  onUpdateProfile,
}) => {
  const [editingField, setEditingField] = useState<EditFieldKey>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP Verification Modal state for email & mobile
  const [verificationData, setVerificationData] = useState<{
    type: 'EMAIL' | 'MOBILE';
    value: string;
  } | null>(null);

  const openEditModal = (field: EditFieldKey) => {
    setError('');
    setEditingField(field);
    if (field === 'name') setFieldValue(profile.name || '');
    if (field === 'email') setFieldValue(profile.email || '');
    if (field === 'mobile') setFieldValue(profile.mobile || '');
    if (field === 'dob') setFieldValue(profile.dob || '');
    if (field === 'gender') setFieldValue(profile.gender || '');
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!editingField) return;

    const val = fieldValue.trim();

    // Check sensitive fields requiring OTP verification
    if (editingField === 'email' && val !== profile.email) {
      if (!val || !val.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      setVerificationData({ type: 'EMAIL', value: val });
      setEditingField(null);
      return;
    }

    if (editingField === 'mobile' && val !== profile.mobile) {
      if (val && val.length < 8) {
        setError('Please enter a valid mobile phone number.');
        return;
      }
      setVerificationData({ type: 'MOBILE', value: val });
      setEditingField(null);
      return;
    }

    // Standard non-sensitive edit
    setIsLoading(true);
    try {
      await onUpdateProfile({ [editingField]: val || null });
      setEditingField(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update field');
    } finally {
      setIsLoading(false);
    }
  };

  const { showToast } = useToast();

  const handleVerifiedSave = async () => {
    if (!verificationData) return;
    try {
      if (verificationData.type === 'EMAIL') {
        await onUpdateProfile({ email: verificationData.value, isEmailVerified: true });
      } else {
        await onUpdateProfile({ mobile: verificationData.value, isMobileVerified: true });
      }
      showToast('✓ Profile updated successfully', 'success', 'Profile Updated');
      setVerificationData(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save verified value', 'error', 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 apple-shadow text-center space-y-3">
        <div className="relative inline-block">
          <Avatar name={profile.name || 'User'} size="xl" className="shadow-md" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{profile.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{profile.email}</p>
        </div>
      </div>

      {/* Fields List Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Account Identity & Contact
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Tap field to edit</span>
        </div>

        <div className="space-y-3">
          {/* Full Name */}
          <div
            onClick={() => openEditModal('name')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Full Name
                </span>
                <span className="text-xs font-bold text-slate-900">{profile.name || 'Not set'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Edit2 className="w-3.5 h-3.5" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Email Address */}
          <div
            onClick={() => openEditModal('email')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </span>
                  {profile.isEmailVerified ? (
                    <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full">
                      Unverified
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-900">{profile.email || 'Not set'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Edit2 className="w-3.5 h-3.5" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Mobile Number */}
          <div
            onClick={() => openEditModal('mobile')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Mobile Number
                  </span>
                  {profile.isMobileVerified ? (
                    <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified
                    </span>
                  ) : profile.mobile ? (
                    <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full">
                      Unverified
                    </span>
                  ) : null}
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {profile.mobile || 'Add Mobile Number'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Edit2 className="w-3.5 h-3.5" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Date of Birth */}
          <div
            onClick={() => openEditModal('dob')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Date of Birth (Optional)
                </span>
                <span className="text-xs font-bold text-slate-900">{profile.dob || 'Not specified'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Edit2 className="w-3.5 h-3.5" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Gender */}
          <div
            onClick={() => openEditModal('gender')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Gender (Optional)
                </span>
                <span className="text-xs font-bold text-slate-900">{profile.gender || 'Not specified'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Edit2 className="w-3.5 h-3.5" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Field Modal */}
      {editingField && (
        <Modal
          isOpen={!!editingField}
          onClose={() => setEditingField(null)}
          title={`Edit ${
            editingField === 'name'
              ? 'Full Name'
              : editingField === 'email'
              ? 'Email Address'
              : editingField === 'mobile'
              ? 'Mobile Number'
              : editingField === 'dob'
              ? 'Date of Birth'
              : 'Gender'
          }`}
        >
          <form onSubmit={handleSaveField} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {(editingField === 'email' || editingField === 'mobile') && (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-1">
                <span className="font-bold block">🔒 Verification Required</span>
                <p className="text-[11px] text-amber-800">
                  Changing your {editingField} requires completing a 6-digit OTP verification step before updating your profile.
                </p>
              </div>
            )}

            {editingField === 'gender' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Select Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setFieldValue(g)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                        fieldValue === g
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            ) : editingField === 'dob' ? (
              <Input
                type="date"
                label="Date of Birth"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
              />
            ) : (
              <Input
                label={editingField === 'name' ? 'Full Name' : editingField === 'email' ? 'Email Address' : 'Mobile Number'}
                placeholder={
                  editingField === 'name'
                    ? 'e.g. Parikshit Gole'
                    : editingField === 'email'
                    ? 'parikshit@example.com'
                    : '+91 98765 43210'
                }
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                required={editingField === 'name' || editingField === 'email'}
              />
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <Button type="submit" isLoading={isLoading} className="flex-1 text-xs font-bold py-3">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* OTP Verification Modal Trigger */}
      {verificationData && (
        <VerificationModal
          isOpen={!!verificationData}
          onClose={() => setVerificationData(null)}
          targetType={verificationData.type}
          targetValue={verificationData.value}
          onVerified={handleVerifiedSave}
        />
      )}
    </div>
  );
};
