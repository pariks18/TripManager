'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowLeft,
  Sparkles,
  Layers,
  FileText,
  ShieldCheck,
  HelpCircle,
  Info,
  ChevronRight,
  Heart,
  ExternalLink,
} from 'lucide-react';

interface AppInfoViewProps {
  onBack: () => void;
}

export const AppInfoView: React.FC<AppInfoViewProps> = ({ onBack }) => {
  const [activeModal, setActiveModal] = useState<'TERMS' | 'PRIVACY' | 'HELP' | 'ABOUT' | null>(null);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 apple-shadow text-center space-y-3">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">TripSplit</h3>
          <p className="text-xs text-slate-400 mt-0.5">Smart Group Travel & Expense Management</p>
        </div>
        <span className="inline-block text-[11px] font-extrabold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
          Version 2.6 Mobile First
        </span>
      </div>

      {/* Options List Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
          App Information & Support
        </h3>

        <div className="space-y-3">
          {/* Supported Currencies */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Supported Currencies</span>
                <span className="text-[11px] text-slate-500">INR (₹), USD ($), EUR (€), THB (฿), GBP (£)</span>
              </div>
            </div>
          </div>

          {/* About TripSplit */}
          <div
            onClick={() => setActiveModal('ABOUT')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">About TripSplit</span>
                <span className="text-[11px] text-slate-400">Learn more about the platform</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Help & Support */}
          <div
            onClick={() => setActiveModal('HELP')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Help & Support</span>
                <span className="text-[11px] text-slate-400">FAQs and support contact details</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Terms & Conditions */}
          <div
            onClick={() => setActiveModal('TERMS')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Terms & Conditions</span>
                <span className="text-[11px] text-slate-400">User agreement and terms of use</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Privacy Policy */}
          <div
            onClick={() => setActiveModal('PRIVACY')}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Privacy Policy</span>
                <span className="text-[11px] text-slate-400">How we protect your data</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Info Modals */}
      {activeModal && (
        <Modal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={
            activeModal === 'ABOUT'
              ? 'About TripSplit'
              : activeModal === 'HELP'
              ? 'Help & Support'
              : activeModal === 'TERMS'
              ? 'Terms & Conditions'
              : 'Privacy Policy'
          }
        >
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            {activeModal === 'ABOUT' && (
              <div className="space-y-3">
                <p>
                  <strong>TripSplit</strong> is a modern, mobile-first group travel management platform designed to simplify expense splits, debt settlements, advance payments, itinerary planning, and stay details.
                </p>
                <p>
                  Built with greedy minimal debt-settlement algorithms and two-way verification protocols, TripSplit ensures every member pays accurately without friction.
                </p>
              </div>
            )}

            {activeModal === 'HELP' && (
              <div className="space-y-3">
                <p>Need assistance or have a question about your trip account?</p>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="font-bold block text-slate-900">Support Email</span>
                  <span className="font-mono text-emerald-700">support@tripsplit.app</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Our team typically responds within 24 hours for account or trip queries.
                </p>
              </div>
            )}

            {activeModal === 'TERMS' && (
              <div className="space-y-3">
                <p>
                  By using TripSplit, you agree to fair and accurate recording of shared group expenses and settlements.
                </p>
                <p>
                  Trip members are responsible for verifying their expense entries and settling outstanding balances with fellow trip participants.
                </p>
              </div>
            )}

            {activeModal === 'PRIVACY' && (
              <div className="space-y-3">
                <p>
                  Your personal documents, passwords, and user information are stored securely with strict encryption protocols.
                </p>
                <p>
                  Personal ID proofs uploaded to your profile are never shared publicly and are accessible only by you and your trip Super Host/Admin for travel verification.
                </p>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors mt-2"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
