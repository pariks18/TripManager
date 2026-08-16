'use client';

import React, { useEffect, useState } from 'react';
import { PollDetail, PollOptionDetail } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import {
  Vote,
  Plus,
  CheckCircle2,
  Lock,
  Unlock,
  Users,
  Utensils,
  Compass,
  Clock,
  MapPin,
  Sparkles,
  RefreshCw,
  X,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

interface LivePollsViewProps {
  tripId: string;
  isAdmin: boolean;
  currentUserId: string;
  onRefreshTrip?: () => void;
}

import { useToast } from '@/components/ui/Toast';

export const LivePollsView: React.FC<LivePollsViewProps> = React.memo(({
  tripId,
  isAdmin,
  currentUserId,
  onRefreshTrip,
}) => {
  const { showToast } = useToast();
  const [polls, setPolls] = useState<PollDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  // Create Poll Form State
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('Restaurant');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPolls = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/polls`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch polls');
      setPolls(data.polls || []);
    } catch (err: any) {
      console.error('Fetch polls error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) fetchPolls();
  }, [tripId]);

  const handleVote = async (pollId: string, optionId: string) => {
    setVotingPollId(pollId);
    try {
      const res = await fetch(`/api/trips/${tripId}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to vote');
      }

      fetchPolls();
      showToast('✓ Vote recorded', 'success', 'Vote Submitted');
      if (onRefreshTrip) onRefreshTrip();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit vote', 'error', 'Error');
    } finally {
      setVotingPollId(null);
    }
  };

  const handleToggleClosePoll = async (pollId: string, currentIsClosed: boolean) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/polls/${pollId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClosed: !currentIsClosed }),
      });
      if (!res.ok) throw new Error('Failed to update poll status');

      fetchPolls();
      showToast(currentIsClosed ? 'Poll re-opened' : 'Poll closed', 'info', 'Poll Updated');
      if (onRefreshTrip) onRefreshTrip();
    } catch (err: any) {
      showToast(err.message || 'Failed to update poll status', 'error', 'Error');
    }
  };

  const handleAddOptionField = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOptionField = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question.trim()) {
      setErrorMsg('Please enter a poll question.');
      return;
    }
    if (validOptions.length < 2) {
      setErrorMsg('Please provide at least 2 non-empty poll options.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          category,
          options: validOptions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create poll');

      setQuestion('');
      setCategory('Restaurant');
      setOptions(['', '']);
      setIsCreateModalOpen(false);
      fetchPolls();
      if (onRefreshTrip) onRefreshTrip();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['All', 'Restaurant', 'Activity', 'Departure Time', 'Destination', 'General'];

  const filteredPolls = polls.filter((p) => {
    if (selectedCategory === 'All') return true;
    return (p.category || 'General').toLowerCase() === selectedCategory.toLowerCase();
  });

  const getCategoryIcon = (cat?: string | null) => {
    switch (cat?.toLowerCase()) {
      case 'restaurant':
        return Utensils;
      case 'activity':
        return Compass;
      case 'departure time':
        return Clock;
      case 'destination':
        return MapPin;
      default:
        return Vote;
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading Live Decision Polls...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 backdrop-blur-md rounded-2xl text-emerald-400">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Live Group Polls</h3>
            <p className="text-xs text-emerald-300/80">
              Cast your vote in real-time for quick & transparent group decisions
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1" /> Create Live Poll
          </Button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Poll Cards List */}
      {filteredPolls.length > 0 ? (
        <div className="space-y-4">
          {filteredPolls.map((poll) => {
            const CategoryIcon = getCategoryIcon(poll.category);
            return (
              <div
                key={poll.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4 transition-all"
              >
                {/* Poll Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        <CategoryIcon className="w-3 h-3" />
                        {poll.category || 'General'}
                      </span>

                      {poll.isClosed ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Poll Closed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                          Live Now
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {poll.question}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Created by {poll.createdBy.name}</span>
                      <span>•</span>
                      <span>{formatDate(poll.createdAt)}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-700">{poll.totalVotes} Votes</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleToggleClosePoll(poll.id, poll.isClosed)}
                      className={`p-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0 ${
                        poll.isClosed
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={poll.isClosed ? 'Reopen Voting' : 'Close Poll'}
                    >
                      {poll.isClosed ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Reopen
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Close
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Poll Options & Vote Bars */}
                <div className="space-y-2.5">
                  {poll.options.map((option) => {
                    const isSelected = poll.userVotedOptionId === option.id;
                    return (
                      <button
                        key={option.id}
                        disabled={poll.isClosed || votingPollId === poll.id}
                        onClick={() => handleVote(poll.id, option.id)}
                        className={`w-full relative overflow-hidden rounded-2xl p-3.5 border transition-all text-left group ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                            : poll.isClosed
                            ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                            : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/50'
                        }`}
                      >
                        {/* Percentage Fill Background */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                            isSelected ? 'bg-emerald-200/50' : 'bg-slate-100/80'
                          }`}
                          style={{ width: `${option.percentage}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white group-hover:border-emerald-400'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>

                            <span
                              className={`text-sm font-semibold ${
                                isSelected ? 'text-emerald-950 font-bold' : 'text-slate-800'
                              }`}
                            >
                              {option.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
                            <span>{option.voteCount} votes</span>
                            <span className="text-slate-400">({option.percentage}%)</span>
                          </div>
                        </div>

                        {/* Voter Avatars Preview */}
                        {option.votes.length > 0 && (
                          <div className="relative z-10 flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-200/60">
                            <div className="flex -space-x-1.5">
                              {option.votes.slice(0, 5).map((v) => (
                                <Avatar key={v.id} name={v.user.name} size="sm" />
                              ))}
                            </div>
                            {option.votes.length > 5 && (
                              <span className="text-[10px] font-bold text-slate-400 pl-1">
                                +{option.votes.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 apple-shadow space-y-3">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No live polls created yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Super Host can create live decision polls for restaurant picks, activity choices, departure times, and destination votes.
          </p>
        </div>
      )}

      {/* Create Live Poll Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-2xl">
                  <Vote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Live Decision Poll</h3>
                  <p className="text-xs text-slate-400">Real-time group voting</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Restaurant">Restaurant & Dining Choice</option>
                  <option value="Activity">Group Activity / Fun</option>
                  <option value="Departure Time">Departure Time / Schedule</option>
                  <option value="Destination">Next Destination</option>
                  <option value="General">General Vote</option>
                </select>
              </div>

              {/* Question Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Poll Question / Decision Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Where should we go for dinner tonight?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Options Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Poll Options (At least 2) <span className="text-rose-500">*</span>
                  </label>
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOptionField}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {options.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder={`Option ${index + 1} (e.g. ${
                          index === 0 ? 'Fisherman Wharf' : index === 1 ? "Tito's Lane" : 'Beach Shack'
                        })`}
                        value={opt}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-2 focus:outline-none focus:border-emerald-500"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(index)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSubmitting ? 'Creating...' : 'Publish Live Poll'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});
