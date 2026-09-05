'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfileDetail, UserDocumentDetail } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { BottomNav } from '@/components/ui/BottomNav';

// Sub-screen components
import { PersonalInformationView } from '@/components/profile/PersonalInformationView';
import { AccountSecurityView } from '@/components/profile/AccountSecurityView';
import { TravelInformationView } from '@/components/profile/TravelInformationView';
import { DocumentsView } from '@/components/profile/DocumentsView';
import { PrivacyPermissionsView } from '@/components/profile/PrivacyPermissionsView';
import { AppInfoView } from '@/components/profile/AppInfoView';

import {
  User,
  Mail,
  LogOut,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  FileText,
  Lock,
  Phone,
  Calendar,
  Globe,
  Coins,
  Compass,
  KeyRound,
  Trash2,
  Undo2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  ShieldAlert,
} from 'lucide-react';

type SubScreenType = 'overview' | 'personal' | 'security' | 'travel' | 'documents' | 'privacy' | 'about';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileDetail | null>(null);
  const [documents, setDocuments] = useState<UserDocumentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-screen navigation state
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreenType>('overview');

  // Undo Toast state
  const [undoState, setUndoState] = useState<{
    previousProfile: UserProfileDetail;
    message: string;
  } | null>(null);

  // Delete Account Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchProfileAndDocuments();
  }, []);

  const fetchProfileAndDocuments = async () => {
    setIsLoading(true);
    try {
      const [profileRes, docsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/documents'),
      ]);

      if (profileRes.status === 401) {
        router.push('/login');
        return;
      }

      const profileData = await profileRes.json();
      const docsData = await docsRes.json();

      if (profileData.profile) setProfile(profileData.profile);
      if (docsData.documents) setDocuments(docsData.documents);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedData: Partial<UserProfileDetail>) => {
    if (!profile) return;
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      if (data.previousProfile && data.profile) {
        setUndoState({
          previousProfile: data.previousProfile,
          message: 'Profile changes saved successfully.',
        });
        setProfile(data.profile);

        // Auto hide undo toast after 6 seconds
        setTimeout(() => {
          setUndoState(null);
        }, 6000);
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleUndo = async () => {
    if (!undoState || !profile) return;
    const prev = undoState.previousProfile;
    setUndoState(null);

    try {
      await handleUpdateProfile({
        name: prev.name,
        email: prev.email,
        mobile: prev.mobile,
        dob: prev.dob,
        gender: prev.gender,
        isEmailVerified: prev.isEmailVerified,
        isMobileVerified: prev.isMobileVerified,
        nationality: prev.nationality,
        preferredCurrency: prev.preferredCurrency,
        emergencyContactName: prev.emergencyContactName,
        emergencyContactPhone: prev.emergencyContactPhone,
        travelPreferences: prev.travelPreferences,
      });
    } catch (err) {
      console.error('Failed to undo changes:', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (deleteConfirmationInput !== 'DELETE') {
      setDeleteError('Please type DELETE in all capital letters to confirm.');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const res = await fetch('/api/user/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      router.push('/login');
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading Profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-12">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-3 py-3.5 sm:px-6">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              if (activeSubScreen !== 'overview') {
                setActiveSubScreen('overview');
              } else {
                router.push('/dashboard');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />{' '}
            {activeSubScreen === 'overview' ? 'Back to Trips' : 'Overview'}
          </button>
          <h1 className="text-base font-extrabold text-slate-900">
            {activeSubScreen === 'overview'
              ? 'Account & Settings'
              : activeSubScreen === 'personal'
              ? 'Personal Info'
              : activeSubScreen === 'security'
              ? 'Account & Security'
              : activeSubScreen === 'travel'
              ? 'Travel Information'
              : activeSubScreen === 'documents'
              ? 'ID Proofs'
              : activeSubScreen === 'privacy'
              ? 'Privacy & Permissions'
              : 'About TripNizer'}
          </h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl mx-auto px-3 py-4 sm:px-6 space-y-5">
        {/* SUB-SCREEN 1: Personal Information */}
        {activeSubScreen === 'personal' && (
          <PersonalInformationView
            profile={profile}
            onBack={() => setActiveSubScreen('overview')}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {/* SUB-SCREEN 2: Account & Security */}
        {activeSubScreen === 'security' && (
          <AccountSecurityView
            profile={profile}
            onBack={() => setActiveSubScreen('overview')}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {/* SUB-SCREEN 3: Travel Information */}
        {activeSubScreen === 'travel' && (
          <TravelInformationView
            profile={profile}
            onBack={() => setActiveSubScreen('overview')}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {/* SUB-SCREEN 4: Documents & ID Proofs */}
        {activeSubScreen === 'documents' && (
          <DocumentsView
            documents={documents}
            onBack={() => setActiveSubScreen('overview')}
            onRefreshDocs={fetchProfileAndDocuments}
          />
        )}

        {/* SUB-SCREEN 5: Privacy & Permissions */}
        {activeSubScreen === 'privacy' && (
          <PrivacyPermissionsView
            onBack={() => setActiveSubScreen('overview')}
            onNavigateDocuments={() => setActiveSubScreen('documents')}
          />
        )}

        {/* SUB-SCREEN 6: App Information */}
        {activeSubScreen === 'about' && (
          <AppInfoView onBack={() => setActiveSubScreen('overview')} />
        )}

        {/* MAIN OVERVIEW SCREEN */}
        {activeSubScreen === 'overview' && (
          <>
            {/* Header Profile Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 apple-shadow text-center space-y-4">
              <div className="relative inline-block">
                <Avatar name={profile.name || 'User'} size="xl" className="mx-auto shadow-md" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{profile.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{profile.email}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" /> Verified TripNizer Member
                </div>

                {profile.isEmailVerified && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                    Email Verified
                  </span>
                )}
              </div>
            </div>

            {/* Navigation Cards Menu */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-2">
                Account Management
              </h3>

              {/* 1. Personal Information */}
              <div
                onClick={() => setActiveSubScreen('personal')}
                className="bg-white rounded-3xl p-4 border border-slate-100 hover:border-slate-200 apple-shadow cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Personal Information</h4>
                    <p className="text-[11px] text-slate-400">Name, Email, Mobile, DOB, Gender</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* 2. Account & Security */}
              <div
                onClick={() => setActiveSubScreen('security')}
                className="bg-white rounded-3xl p-4 border border-slate-100 hover:border-slate-200 apple-shadow cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Account & Security</h4>
                    <p className="text-[11px] text-slate-400">Verification status, Change password</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* 3. Travel Information */}
              <div
                onClick={() => setActiveSubScreen('travel')}
                className="bg-white rounded-3xl p-4 border border-slate-100 hover:border-slate-200 apple-shadow cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Travel Information</h4>
                    <p className="text-[11px] text-slate-400">Emergency contact, Nationality, Currency</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* 4. Documents & ID Proofs */}
              <div
                onClick={() => setActiveSubScreen('documents')}
                className="bg-white rounded-3xl p-4 border border-slate-100 hover:border-slate-200 apple-shadow cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Documents & ID Proofs</h4>
                      <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {documents.length} Added
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Aadhaar, PAN, Passport, Driving Licence</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* 5. Privacy & Permissions */}
              <div
                onClick={() => setActiveSubScreen('privacy')}
                className="bg-white rounded-3xl p-4 border border-slate-100 hover:border-slate-200 apple-shadow cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Privacy & Permissions</h4>
                    <p className="text-[11px] text-slate-400">Document access policy & host permissions</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* 6. Application Information */}
              <div
                onClick={() => setActiveSubScreen('about')}
                className="bg-white rounded-3xl p-4 border border-slate-100 hover:border-slate-200 apple-shadow cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">App Info & Support</h4>
                    <p className="text-[11px] text-slate-400">Version 2.6, Terms, Privacy Policy, FAQs</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Section 8: Account Actions */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-2">
                Account Actions
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleLogout}
                  variant="secondary"
                  className="w-full text-xs font-bold py-3 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-slate-600" /> Sign Out
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmationInput('');
                    setDeleteError('');
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating Undo Toast Notification */}
      {undoState && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-800 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2.5 text-xs font-medium min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{undoState.message}</span>
          </div>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 text-xs font-extrabold text-amber-400 hover:text-amber-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 shrink-0 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Account"
        >
          <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Permanent Danger Zone Action</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800">
                Deleting your account will remove your personal profile, stored ID proofs, and account access. Trip history and expense split records will be preserved for other members.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Type <strong className="text-rose-600">DELETE</strong> to Confirm
              </label>
              <Input
                placeholder="DELETE"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                required
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="danger"
                isLoading={isDeletingAccount}
                className="flex-1 text-xs font-bold py-3"
              >
                Permanently Delete
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
