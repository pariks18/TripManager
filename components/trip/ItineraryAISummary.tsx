'use client';

import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface ItineraryAISummaryProps {
  tripId: string;
  itemId: string;
}

export const ItineraryAISummary: React.FC<ItineraryAISummaryProps> = React.memo(({
  tripId,
  itemId,
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAISummary = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI summary');
      }

      if (data.summary) {
        setSummary(data.summary);
      } else {
        throw new Error('AI returned an empty summary');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-2 mt-2 border-t border-slate-100/80">
      {/* 1. Initial State (No Summary, Not Loading, No Error) */}
      {!summary && !isLoading && !error && (
        <div className="flex justify-end">
          <button
            onClick={fetchAISummary}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 active:scale-95 border border-indigo-200/80 rounded-xl transition-all shadow-xs group cursor-pointer"
            title="Generate AI Summary for this itinerary item"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 group-hover:rotate-12 transition-transform" />
            <span>✨ AI Summary</span>
          </button>
        </div>
      )}

      {/* 2. Loading State */}
      {isLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-700">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Generating summary...</span>
            </div>
            <button
              disabled
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl opacity-60 cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ AI Summary</span>
            </button>
          </div>
          
          <div className="p-3 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-slate-50/50 rounded-2xl border border-indigo-100/60 space-y-2 animate-pulse">
            <div className="h-3.5 bg-indigo-200/50 rounded-md w-3/4"></div>
            <div className="h-3.5 bg-indigo-200/40 rounded-md w-full"></div>
            <div className="h-3.5 bg-indigo-200/30 rounded-md w-5/6"></div>
          </div>
        </div>
      )}

      {/* 3. Error State */}
      {!isLoading && error && (
        <div className="p-3 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-rose-700 font-medium truncate">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <button
            onClick={fetchAISummary}
            type="button"
            className="px-2.5 py-1 font-bold text-rose-700 hover:text-rose-900 bg-white hover:bg-rose-100/80 border border-rose-200 rounded-lg shrink-0 transition-colors shadow-2xs cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* 4. Success State */}
      {!isLoading && summary && (
        <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-100 rounded-2xl space-y-2 shadow-2xs transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="p-1 bg-indigo-600 rounded-lg text-white shadow-2xs">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="text-xs font-extrabold text-indigo-950 tracking-tight">
                AI Summary
              </span>
            </div>
            
            <button
              onClick={fetchAISummary}
              type="button"
              className="p-1 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100/60 rounded-lg transition-colors cursor-pointer"
              title="Regenerate AI summary"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
});

ItineraryAISummary.displayName = 'ItineraryAISummary';
