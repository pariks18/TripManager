'use client';

import React, { useState } from 'react';
import { UserProfileDetail } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowLeft,
  Globe,
  PhoneCall,
  Coins,
  Compass,
  Edit2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface TravelInformationViewProps {
  profile: UserProfileDetail;
  onBack: () => void;
  onUpdateProfile: (updatedData: Partial<UserProfileDetail>) => Promise<void>;
}

type EditTravelKey = 'emergencyContact' | 'nationality' | 'preferredCurrency' | 'travelPreferences' | null;

const SUPPORTED_CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
  { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
  { symbol: '€', code: 'EUR', name: 'Euro (€)' },
  { symbol: '฿', code: 'THB', name: 'Thai Baht (฿)' },
  { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
  { symbol: 'AED', code: 'AED', name: 'UAE Dirham (AED)' },
];

export const TravelInformationView: React.FC<TravelInformationViewProps> = ({
  profile,
  onBack,
  onUpdateProfile,
}) => {
  const [editingField, setEditingField] = useState<EditTravelKey>(null);
  const [emergencyName, setEmergencyName] = useState(profile.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyContactPhone || '');
  const [nationality, setNationality] = useState(profile.nationality || '');
  const [currency, setCurrency] = useState(profile.preferredCurrency || '₹');
  const [preferences, setPreferences] = useState(profile.travelPreferences || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const openEditModal = (field: EditTravelKey) => {
    setError('');
    setEditingField(field);
    if (field === 'emergencyContact') {
      setEmergencyName(profile.emergencyContactName || '');
      setEmergencyPhone(profile.emergencyContactPhone || '');
    } else if (field === 'nationality') {
      setNationality(profile.nationality || '');
    } else if (field === 'preferredCurrency') {
      setCurrency(profile.preferredCurrency || '₹');
    } else if (field === 'travelPreferences') {
      setPreferences(profile.travelPreferences || '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (editingField === 'emergencyContact') {
        await onUpdateProfile({
          emergencyContactName: emergencyName.trim() || null,
          emergencyContactPhone: emergencyPhone.trim() || null,
        });
      } else if (editingField === 'nationality') {
        await onUpdateProfile({ nationality: nationality.trim() || null });
      } else if (editingField === 'preferredCurrency') {
        await onUpdateProfile({ preferredCurrency: currency });
      } else if (editingField === 'travelPreferences') {
        await onUpdateProfile({ travelPreferences: preferences.trim() || null });
      }

      setEditingField(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update travel info');
    } finally {
      setIsLoading(false);
    }
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
        <h2 className="text-sm font-extrabold text-slate-900">Travel Information</h2>
        <div className="w-16" />
      </div>

      {/* Intro Banner */}
      <div className="bg-blue-50 border border-blue-200/80 rounded-3xl p-5 space-y-1.5 text-xs text-blue-900 apple-shadow">
        <div className="flex items-center gap-2 font-bold text-blue-950">
          <Compass className="w-4 h-4 text-blue-600" />
          <span>Personal Travel Preferences & Info</span>
        </div>
        <p className="text-[11px] text-blue-800 leading-relaxed">
          These non-essential travel preferences stay saved in your profile for trip convenience and hotel check-in bookings.
        </p>
      </div>

      {/* Fields List Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
          Travel Details
        </h3>

        <div className="space-y-3">
          {/* Emergency Contact */}
          <div
            onClick={() => openEditModal('emergencyContact')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Emergency Contact (Optional)
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {profile.emergencyContactName
                    ? `${profile.emergencyContactName} (${profile.emergencyContactPhone || 'No Phone'})`
                    : 'Not specified'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Edit2 className="w-3.5 h-3.5" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Nationality */}
          <div
            onClick={() => openEditModal('nationality')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Nationality (Optional)
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {profile.nationality || 'Indian (Default)'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Edit2 className="w-3.5 h-3.5" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Preferred Currency */}
          <div
            onClick={() => openEditModal('preferredCurrency')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Preferred Currency
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {profile.preferredCurrency || '₹ (INR)'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Edit2 className="w-3.5 h-3.5" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Travel Preferences */}
          <div
            onClick={() => openEditModal('travelPreferences')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Travel Preferences (Optional)
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {profile.travelPreferences || 'e.g. Vegetarian food, Window seat, Mountain treks'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Edit2 className="w-3.5 h-3.5" />
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingField && (
        <Modal
          isOpen={!!editingField}
          onClose={() => setEditingField(null)}
          title={`Edit ${
            editingField === 'emergencyContact'
              ? 'Emergency Contact'
              : editingField === 'nationality'
              ? 'Nationality'
              : editingField === 'preferredCurrency'
              ? 'Preferred Currency'
              : 'Travel Preferences'
          }`}
        >
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {editingField === 'emergencyContact' ? (
              <div className="space-y-3">
                <Input
                  label="Contact Person Name"
                  placeholder="e.g. Spouse / Parent Name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
                <Input
                  label="Contact Phone Number"
                  placeholder="+91 98765 43210"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </div>
            ) : editingField === 'nationality' ? (
              <Input
                label="Nationality"
                placeholder="e.g. Indian, American, British"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              />
            ) : editingField === 'preferredCurrency' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-2">
                  Select Preferred Currency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <button
                      type="button"
                      key={c.code}
                      onClick={() => setCurrency(c.symbol)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-start gap-1 transition-all ${
                        currency === c.symbol
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{c.symbol}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Dietary / Travel Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Pure Veg, Window Seat preference, Early riser"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
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
                Save Travel Info
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
