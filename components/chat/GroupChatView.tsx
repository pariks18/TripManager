'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageDetail, UserSummary } from '@/types';
import { useSocket } from '@/lib/useSocket';
import { Avatar } from '@/components/ui/Avatar';
import { formatTime, formatDate } from '@/lib/utils';
import { Send, MessageSquare, Wifi, WifiOff, Loader2, ArrowDown } from 'lucide-react';

interface GroupChatViewProps {
  tripId: string;
  tripName: string;
  currentUser: UserSummary;
}

export const GroupChatView: React.FC<GroupChatViewProps> = React.memo(({ tripId, tripName, currentUser }) => {
  const [inputText, setInputText] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const {
    messages,
    isConnected,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    sendMessage,
    loadMoreMessages,
    dismissError,
  } = useSocket(tripId, currentUser.id);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new message arrives
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [isLoading]);

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  // Handle scroll events for loading older messages & showing scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // Show floating scroll-to-bottom button if scrolled up
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);

    // Trigger loading older messages when scrolled near top
    if (scrollTop < 50 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* 1. Header */}
      <div className="bg-slate-50/90 backdrop-blur-md px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-2xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 line-clamp-1">{tripName} Chat</h3>
            <p className="text-[11px] text-slate-400 font-medium">Real-time trip member discussion</p>
          </div>
        </div>

        {/* Real-time Connection Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span>Connecting...</span>
            </>
          )}
        </div>
      </div>

      {/* 2. Messages List Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 relative"
      >
        {/* Load More Button or Spinner */}
        {hasMore && (
          <div className="text-center py-2">
            <button
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="text-[11px] font-bold text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-full shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              {isLoadingMore && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
              {isLoadingMore ? 'Loading older messages...' : 'Load older messages'}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-2.5 max-w-[75%]">
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
              <div className="h-14 bg-slate-200 rounded-2xl w-48 animate-pulse" />
            </div>
            <div className="flex items-start gap-2.5 max-w-[75%] ml-auto justify-end">
              <div className="h-14 bg-emerald-200/60 rounded-2xl w-56 animate-pulse" />
            </div>
            <div className="flex items-start gap-2.5 max-w-[75%]">
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0" />
              <div className="h-12 bg-slate-200 rounded-2xl w-40 animate-pulse" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Chat State */
          <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-3">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-100">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No messages yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Start the group conversation with your fellow trip members!
              </p>
            </div>
          </div>
        ) : (
          /* Message List */
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;
            const showSenderHeader =
              !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

            return (
              <div
                key={msg.id || idx}
                className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="shrink-0 mt-0.5">
                    <Avatar name={msg.sender?.name || 'Member'} size="sm" />
                  </div>
                )}

                <div className={`space-y-1 max-w-[80%] sm:max-w-[70%]`}>
                  {showSenderHeader && (
                    <span className="text-[10px] font-bold text-slate-500 block px-1">
                      {msg.sender?.name}
                    </span>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm break-words ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span
                      className={`text-[9px] block text-right mt-1 font-medium ${
                        isMe ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-20 right-6 p-2.5 bg-white text-slate-700 border border-slate-200 rounded-full shadow-lg hover:bg-slate-50 transition-all z-10"
          title="Scroll to latest messages"
        >
          <ArrowDown className="w-4 h-4 text-emerald-600" />
        </button>
      )}

      {/* Error Notice */}
      {error && (
        <div className="bg-rose-50 border-t border-rose-100 px-4 py-2 text-[11px] font-semibold text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => dismissError()} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Input Footer */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800 placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-[0.97]"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
});
