'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Link as LinkIcon,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PendingRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
  tripCode: string;
  onTripUpdated?: () => void;
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  isOpen,
  onClose,
  tripId,
  tripName,
  tripCode,
  onTripUpdated,
}) => {
  const [inviteToken, setInviteToken] = useState('');
  const [inviteEnabled, setInviteEnabled] = useState(true);
  const [approvalMode, setApprovalMode] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && tripId) {
      fetchInviteData();
    }
  }, [isOpen, tripId]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchInviteData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/invite`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch invite data');

      setInviteToken(data.inviteToken);
      setInviteEnabled(data.inviteEnabled);
      setApprovalMode(data.approvalMode);
      setIsHost(data.isHost);

      if (data.isHost) {
        fetchPendingRequests();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/join-requests`);
      const data = await res.json();
      if (res.ok && data.requests) {
        setPendingRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch pending join requests:', err);
    }
  };

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = inviteToken ? `${origin}/join/${inviteToken}` : `${origin}/join/${tripCode}`;
  const displayUrl = inviteToken ? `tripnizer.in/join/${inviteToken}` : `tripnizer.in/join/${tripCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    showToast('✓ Invite link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(tripCode);
    setCopiedCode(true);
    showToast('✓ Join code copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${tripName} on TripNizer`,
          text: `Hey! Join our trip "${tripName}" on TripNizer to split expenses and plan together.`,
          url: inviteUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleToggleApprovalMode = async () => {
    if (!isHost || isUpdatingSettings) return;
    const newApprovalMode = !approvalMode;
    setIsUpdatingSettings(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/invite/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalMode: newApprovalMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update setting');

      setApprovalMode(data.approvalMode);
      showToast(
        data.approvalMode
          ? 'Host Approval enabled. New members must be approved by you.'
          : 'Host Approval disabled. Members can join instantly.'
      );
      if (onTripUpdated) onTripUpdated();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleToggleInviteEnabled = async () => {
    if (!isHost || isUpdatingSettings) return;
    const newEnabled = !inviteEnabled;
    setIsUpdatingSettings(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/invite/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteEnabled: newEnabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update setting');

      setInviteEnabled(data.inviteEnabled);
      showToast(data.inviteEnabled ? '✓ Invite link enabled' : '✓ Invite link disabled');
      if (onTripUpdated) onTripUpdated();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleRegenerateLink = async () => {
    if (!isHost || isRegenerating) return;
    setIsRegenerating(true);
    setShowRegenerateConfirm(false);

    try {
      const res = await fetch(`/api/trips/${tripId}/invite/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate link');

      setInviteToken(data.inviteToken);
      setInviteEnabled(true);
      showToast('✓ New invite link generated! Old link is now invalid.');
      if (onTripUpdated) onTripUpdated();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleActionOnRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/trips/${tripId}/join-requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process request');

      showToast(data.message);
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (onTripUpdated) onTripUpdated();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">Invite Members</h2>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-[240px]">
                {tripName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`mx-5 mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              toastMessage.type === 'error'
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 space-y-6 overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs font-semibold text-slate-400 animate-pulse">
              Loading invite settings...
            </div>
          ) : (
            <>
              {/* SECTION 1: Invite Link */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                    Invite Link
                  </label>
                  {!inviteEnabled && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Link Disabled
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-300 truncate select-all">
                    {displayUrl}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleCopyLink}
                    disabled={!inviteEnabled}
                    variant="outline"
                    size="sm"
                    className="border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold text-xs"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 mr-1.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400 mr-1.5" /> Copy Link
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleShareLink}
                    disabled={!inviteEnabled}
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share Link
                  </Button>
                </div>
              </div>

              {/* SECTION 2: Join Code */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Join Code
                </label>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xl font-black tracking-widest text-emerald-400">
                      {tripCode}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Enter on tripnizer.in to join directly
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SECTION 3: Host Pending Requests (Host Only) */}
              {isHost && (
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      Pending Join Requests ({pendingRequests.length})
                    </label>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-1">No pending join requests.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-white truncate">{req.userName}</p>
                            <p className="text-[10px] text-slate-400 truncate">{req.userEmail}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleActionOnRequest(req.id, 'approve')}
                              className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleActionOnRequest(req.id, 'reject')}
                              className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 4: Invite Settings (Host Only) */}
              {isHost && (
                <div className="space-y-4 pt-2 border-t border-slate-800/80">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Host Controls
                  </h3>

                  <div className="space-y-3">
                    {/* Toggle Host Approval */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-slate-200 block">
                          Host Approval Required
                        </span>
                        <span className="text-[10px] text-slate-400 block leading-tight">
                          Require approval before new members join
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleApprovalMode}
                        disabled={isUpdatingSettings}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                          approvalMode ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                            approvalMode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle Disable Link */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-xs font-bold text-slate-200 block">
                          Enable Invite Link
                        </span>
                        <span className="text-[10px] text-slate-400 block leading-tight">
                          Allow users to join using the invite link
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleInviteEnabled}
                        disabled={isUpdatingSettings}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                          inviteEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                            inviteEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Regenerate Link */}
                    {!showRegenerateConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowRegenerateConfirm(true)}
                        className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        Regenerate Invite Link
                      </button>
                    ) : (
                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                        <p className="text-xs text-amber-300 font-semibold">
                          Regenerate link? Previous invite links will stop working immediately.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleRegenerateLink}
                            disabled={isRegenerating}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                            {isRegenerating ? 'Regenerating...' : 'Yes, Regenerate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRegenerateConfirm(false)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
