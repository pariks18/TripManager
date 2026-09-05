'use client';

import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface AITripCheckIssue {
  type: 'TIMING_CONFLICT' | 'TIGHT_SCHEDULE' | 'MISSING_INFORMATION' | 'PRACTICAL_SUGGESTION' | string;
  day: number;
  title?: string;
  message: string;
  firstActivity?: string;
  secondActivity?: string;
  gapMinutes?: number;
}

export interface AITripCheckResult {
  status: 'OK' | 'WARNING' | 'CONFLICT';
  issues: AITripCheckIssue[];
  overallSummary: string;
}

interface AITripCheckProps {
  tripId: string;
  itemCount: number;
  onRefreshItinerary?: () => void;
}

const ISSUE_TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string; icon: React.ElementType }
> = {
  TIMING_CONFLICT: {
    label: 'Timing Conflict',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    icon: AlertTriangle,
  },
  TIGHT_SCHEDULE: {
    label: 'Tight Schedule',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: Clock,
  },
  MISSING_INFORMATION: {
    label: 'Missing Information',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-700',
    icon: HelpCircle,
  },
  PRACTICAL_SUGGESTION: {
    label: 'Practical Suggestion',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: Lightbulb,
  },
};

export const AITripCheck: React.FC<AITripCheckProps> = ({
  tripId,
  itemCount,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AITripCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const runAICheck = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${tripId}/ai-trip-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete AI Trip Check');
      }

      setResult({
        status: data.status || 'OK',
        issues: data.issues || [],
        overallSummary: data.overallSummary || 'Itinerary check complete.',
      });
      setIsExpanded(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing the trip.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✅ Trip Check Complete
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> ⚠️ Schedule Warnings
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> ⚠️ Possible Timing Issue
          </span>
        );
      default:
        return null;
    }
  };

  const filteredIssues = React.useMemo(() => {
    if (!result?.issues) return [];
    if (selectedFilter === 'ALL') return result.issues;
    return result.issues.filter((issue) => issue.type === selectedFilter);
  }, [result?.issues, selectedFilter]);

  if (itemCount === 0) {
    return (
      <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50 border border-indigo-100 rounded-3xl p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl shadow-sm shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              🧠 AI Trip Check
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Add your itinerary activities below to run a complete AI trip check for timing conflicts, travel gaps, and schedule validation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-indigo-100 shadow-sm overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-5 text-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl text-amber-300 shrink-0 border border-white/10">
            <Brain className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-black tracking-tight">🧠 AI Trip Check</h4>
              {result && getStatusBadge(result.status)}
            </div>
            <p className="text-xs text-indigo-200/90 mt-0.5 truncate">
              {result
                ? 'Comprehensive itinerary schedule audit & time conflict detection'
                : 'Analyze complete itinerary for timing conflicts & travel buffers'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {result && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}

          <Button
            onClick={runAICheck}
            isLoading={isLoading}
            size="sm"
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold shadow-md border-0 cursor-pointer"
          >
            {result ? (
              <>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Re-Run Check
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Run AI Trip Check
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-6 bg-slate-50/70 border-t border-slate-100 space-y-4 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-700 rounded-full animate-bounce">
            <Brain className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h5 className="text-sm font-extrabold text-slate-800">Checking Full Trip Itinerary...</h5>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Checking activity durations, travel buffer gaps, timing overlaps, and missing information.
            </p>
          </div>
          <div className="w-48 h-1.5 bg-indigo-100 rounded-full mx-auto overflow-hidden">
            <div className="w-1/2 h-full bg-indigo-600 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-5 bg-rose-50 border-t border-rose-100 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h5 className="font-extrabold text-rose-900">Analysis Error</h5>
              <p className="text-rose-700">{error}</p>
            </div>
          </div>
          <Button onClick={runAICheck} size="sm" variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Try Again
          </Button>
        </div>
      )}

      {/* Result Display */}
      {result && !isLoading && isExpanded && (
        <div className="p-5 space-y-5 bg-slate-50/50 border-t border-slate-100">
          {/* Overall Summary Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
              Executive AI Summary
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {result.overallSummary}
            </p>
          </div>

          {/* Filter Pills if issues exist */}
          {result.issues.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Detected Findings ({result.issues.length})
                </h5>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {['ALL', 'TIMING_CONFLICT', 'TIGHT_SCHEDULE', 'MISSING_INFORMATION', 'PRACTICAL_SUGGESTION'].map((filterKey) => {
                    const isSelected = selectedFilter === filterKey;
                    const count = filterKey === 'ALL'
                      ? result.issues.length
                      : result.issues.filter((i) => i.type === filterKey).length;

                    if (filterKey !== 'ALL' && count === 0) return null;

                    return (
                      <button
                        key={filterKey}
                        onClick={() => setSelectedFilter(filterKey)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {filterKey === 'ALL' ? 'All Issues' : ISSUE_TYPE_CONFIG[filterKey]?.label || filterKey} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Issue Cards */}
              <div className="space-y-2.5">
                {filteredIssues.map((issue, idx) => {
                  const config = ISSUE_TYPE_CONFIG[issue.type] || {
                    label: issue.type,
                    bg: 'bg-slate-50',
                    border: 'border-slate-200',
                    text: 'text-slate-700',
                    icon: AlertCircle,
                  };
                  const Icon = config.icon;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border ${config.border} ${config.bg} space-y-2 transition-all`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded-lg bg-white ${config.text} shrink-0 mt-0.5 shadow-xs`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-slate-700">
                                Day {issue.day}
                              </span>
                              <h6 className={`text-xs font-extrabold ${config.text}`}>
                                {issue.title || config.label}
                              </h6>
                            </div>
                            <p className="text-xs text-slate-800 font-medium mt-1 leading-relaxed">
                              {issue.message}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(issue.firstActivity || issue.secondActivity || issue.gapMinutes !== undefined) && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                          {issue.firstActivity && issue.secondActivity && (
                            <span>
                              <strong>Activities:</strong> {issue.firstActivity} ↔ {issue.secondActivity}
                            </span>
                          )}
                          {issue.gapMinutes !== undefined && (
                            <span className="ml-auto font-bold text-amber-700">
                              Gap: {issue.gapMinutes} min
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <h5 className="text-xs font-bold text-emerald-900">✅ Trip Check Complete</h5>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                Your itinerary looks well planned. No major timing conflicts found.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
