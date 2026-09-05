'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  Bell,
  AlertTriangle,
  FileText,
  RefreshCw,
  X,
  CheckCircle2,
  Edit2,
  Clock,
  MapPin,
  Lightbulb,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ItineraryItemDetail } from '@/types';

export interface AISuggestionGroup {
  type: 'MISSING_INFORMATION' | 'REMINDER' | 'WARNING' | string;
  title: string;
  items: string[];
}

interface AIItinerarySuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  item: ItineraryItemDetail;
  initialTab?: 'suggestions' | 'summary';
  onEditItem?: (item: ItineraryItemDetail) => void;
}

const SUGGESTION_TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string; icon: React.ElementType }
> = {
  MISSING_INFORMATION: {
    label: '⚠️ Missing Information',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: HelpCircle,
  },
  REMINDER: {
    label: "💡 Don't Forget",
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    icon: Bell,
  },
  WARNING: {
    label: '⚠️ Possible Issue',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    icon: AlertTriangle,
  },
};

export const AIItinerarySuggestionsModal: React.FC<AIItinerarySuggestionsProps> = ({
  isOpen,
  onClose,
  tripId,
  item,
  initialTab = 'suggestions',
  onEditItem,
}) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'summary'>(initialTab);

  // Suggestions state
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestionGroup[] | null>(null);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Summary state
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Fetch Suggestions
  const fetchSuggestions = React.useCallback(async () => {
    setIsLoadingSuggestions(true);
    setSuggestionsError(null);

    try {
      const res = await fetch(
        `/api/trips/${tripId}/itinerary/${item.id}/suggestions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch AI suggestions');
      }

      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      setSuggestionsError(err.message || 'An error occurred fetching suggestions.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [tripId, item.id]);

  // Fetch Summary
  const fetchSummary = React.useCallback(async () => {
    setIsLoadingSummary(true);
    setSummaryError(null);

    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI summary');
      }

      setSummary(data.summary || '');
    } catch (err: any) {
      setSummaryError(err.message || 'An error occurred generating summary.');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [tripId, item.id]);

  // Initial load when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (initialTab === 'suggestions' && !suggestions && !isLoadingSuggestions) {
        fetchSuggestions();
      } else if (initialTab === 'summary' && !summary && !isLoadingSummary) {
        fetchSummary();
      }
    }
  }, [isOpen, initialTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load summary on tab switch
  React.useEffect(() => {
    if (isOpen && activeTab === 'summary' && !summary && !isLoadingSummary) {
      fetchSummary();
    } else if (isOpen && activeTab === 'suggestions' && !suggestions && !isLoadingSuggestions) {
      fetchSuggestions();
    }
  }, [isOpen, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-xl" noPadding>
      <div className="flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl text-amber-300 border border-white/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                Smart Activity Assistant
              </span>
              <h3 className="text-base font-extrabold text-white truncate max-w-sm">
                {item.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Activity Details Bar */}
        <div className="bg-slate-100/80 px-5 py-2.5 border-b border-slate-200/80 flex items-center gap-3 text-xs font-semibold text-slate-600 overflow-x-auto no-scrollbar shrink-0">
          <span className="bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded-md text-[10px]">
            Day {item.dayNumber}
          </span>
          {item.category && (
            <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
              {item.category}
            </span>
          )}
          {(item.startTime || item.endTime) && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              {item.startTime} {item.endTime ? `- ${item.endTime}` : ''}
            </span>
          )}
          {item.location && (
            <span className="flex items-center gap-1 truncate max-w-[180px]">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="truncate">{item.location}</span>
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-white px-5 shrink-0">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'suggestions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> 💡 AI Suggestions
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'summary'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> ✨ AI Summary
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: SUGGESTIONS */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              {isLoadingSuggestions && (
                <div className="py-8 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    Analyzing activity details for reminders & missing info...
                  </p>
                </div>
              )}

              {suggestionsError && !isLoadingSuggestions && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Error Loading Suggestions
                  </div>
                  <p className="text-xs text-rose-600">{suggestionsError}</p>
                  <Button
                    onClick={fetchSuggestions}
                    size="sm"
                    className="bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
                  </Button>
                </div>
              )}

              {!isLoadingSuggestions && !suggestionsError && suggestions && (
                <>
                  {suggestions.length > 0 ? (
                    <div className="space-y-3.5">
                      {suggestions.map((group, groupIdx) => {
                        const config = SUGGESTION_TYPE_CONFIG[group.type] || {
                          label: group.title || group.type,
                          bg: 'bg-slate-50',
                          border: 'border-slate-200',
                          text: 'text-slate-800',
                          icon: Sparkles,
                        };
                        const Icon = config.icon;

                        return (
                          <div
                            key={groupIdx}
                            className={`p-4 rounded-2xl border ${config.border} ${config.bg} space-y-2.5`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 bg-white rounded-lg ${config.text} shadow-xs`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <h4 className={`text-xs font-extrabold ${config.text}`}>
                                  {config.label}
                                </h4>
                              </div>

                              {group.type === 'MISSING_INFORMATION' && onEditItem && (
                                <button
                                  onClick={() => {
                                    onClose();
                                    onEditItem(item);
                                  }}
                                  className="text-[11px] font-bold text-amber-900 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-amber-300 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Add Details
                                </button>
                              )}
                            </div>

                            <ul className="space-y-1.5 pl-1">
                              {group.items.map((suggestionText, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-slate-700 font-medium flex items-start gap-2 leading-relaxed"
                                >
                                  <span className="text-slate-400 font-bold">•</span>
                                  <span>{suggestionText}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <h4 className="text-sm font-bold text-emerald-900">
                        Everything Looks Ready!
                      </h4>
                      <p className="text-xs text-emerald-700 max-w-xs mx-auto">
                        No missing parameters or warnings found for this activity item.
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <Button
                      onClick={fetchSuggestions}
                      size="sm"
                      variant="secondary"
                      className="text-xs cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Suggestions
                    </Button>
                    <Button onClick={onClose} size="sm" className="text-xs cursor-pointer">
                      Done
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {isLoadingSummary && (
                <div className="py-8 text-center space-y-3">
                  <FileText className="w-8 h-8 text-indigo-600 animate-pulse mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    Generating natural language summary...
                  </p>
                </div>
              )}

              {summaryError && !isLoadingSummary && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Failed to Load Summary
                  </div>
                  <p className="text-xs text-rose-600">{summaryError}</p>
                  <Button
                    onClick={fetchSummary}
                    size="sm"
                    className="bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
                  </Button>
                </div>
              )}

              {!isLoadingSummary && !summaryError && summary && (
                <div className="space-y-4">
                  <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-900 text-xs font-extrabold">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> ✨ AI Summary
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium italic">
                      “{summary}”
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <Button
                      onClick={fetchSummary}
                      size="sm"
                      variant="secondary"
                      className="text-xs cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-generate
                    </Button>
                    <Button onClick={onClose} size="sm" className="text-xs cursor-pointer">
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
