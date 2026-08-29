'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { MessageDetail, UserSummary } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatTime } from '@/lib/utils';
import { LivePollsView } from '@/components/trip/LivePollsView';
import { Send, MessageSquare, ArrowDown, Loader2, Vote } from 'lucide-react';

interface GroupChatViewProps {
  tripId: string;
  tripName: string;
  currentUser: UserSummary;
  isAdmin?: boolean;
}

const formatDateHeader = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const GroupChatView: React.FC<GroupChatViewProps> = React.memo(({ tripId, tripName, currentUser, isAdmin = false }) => {
  const [chatTab, setChatTab] = useState<'messages' | 'polls'>('messages');
  const [messages, setMessages] = useState<MessageDetail[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialLoadRef = useRef(true);
  const isNearBottomRef = useRef(true);

  // Smooth / Immediate container scroll
  const scrollToBottom = (smooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    setHasUnreadBelow(false);
    isNearBottomRef.current = true;
  };

  // Detect scroll position to check if user is at bottom
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    isNearBottomRef.current = isAtBottom;
    if (isAtBottom) {
      setHasUnreadBelow(false);
    }
  };

  // Adjust textarea height dynamically
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  };

  // Fetch initial messages & setup SSE real-time stream
  useEffect(() => {
    if (!tripId) return;

    let eventSource: EventSource | null = null;

    const initChat = async () => {
      setIsLoading(true);

      try {
        const [res] = await Promise.all([
          fetch(`/api/trips/${tripId}/messages`),
          fetch(`/api/trips/${tripId}/messages/read`, { method: 'POST' }),
        ]);
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to load initial messages:', err);
      } finally {
        setIsLoading(false);
      }

      // Connect to Server-Sent Events (SSE) real-time stream
      try {
        eventSource = new EventSource(`/api/trips/${tripId}/messages/stream`);

        eventSource.onmessage = (event) => {
          try {
            if (event.data && event.data.startsWith('{')) {
              const newMsg: MessageDetail = JSON.parse(event.data);
              if (newMsg.content === '__READ_RECEIPT__') return;

              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              // Mark as read immediately when active chat view is open
              fetch(`/api/trips/${tripId}/messages/read`, { method: 'POST' }).catch(() => {});
            }
          } catch (e) {
            console.error('Error parsing real-time message stream event:', e);
          }
        };
      } catch (err) {
        console.error('Failed to connect real-time stream:', err);
      }
    };

    initChat();

    // Periodic sync fallback (every 2 seconds)
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/messages?limit=20`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => {
            const map = new Map();
            prev.forEach((m) => map.set(m.id, m));
            data.messages.forEach((m: MessageDetail) => map.set(m.id, m));
            const merged = Array.from(map.values());
            merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return merged;
          });
        }
      } catch (e) {}
    }, 2000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(syncInterval);
    };
  }, [tripId]);

  // Handle scrolling when messages change
  useLayoutEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoadRef.current) {
      scrollToBottom(false);
      isInitialLoadRef.current = false;
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const isMyMessage = lastMsg.senderId === currentUser.id;

    if (isMyMessage || isNearBottomRef.current) {
      scrollToBottom(true);
    } else {
      setHasUnreadBelow(true);
    }
  }, [messages, currentUser.id]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch(`/api/trips/${tripId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(() => scrollToBottom(true), 40);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by Date Header
  const groupedMessages = React.useMemo(() => {
    const groups: { dateHeader: string; msgs: MessageDetail[] }[] = [];
    messages.forEach((msg) => {
      const dateHeader = formatDateHeader(msg.createdAt);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.dateHeader === dateHeader) {
        lastGroup.msgs.push(msg);
      } else {
        groups.push({ dateHeader, msgs: [msg] });
      }
    });
    return groups;
  }, [messages]);

  return (
    <div className="flex flex-col h-[580px] sm:h-[620px] max-h-[78vh] w-full max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* 1. Header (Fixed Top) */}
      <div className="shrink-0 bg-slate-50/90 backdrop-blur-sm px-4 py-3 border-b border-slate-200/80 flex items-center justify-between z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-700 rounded-xl">
            <MessageSquare className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{tripName} Chat</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-slate-500">Live group conversation</span>
            </div>
          </div>
        </div>

        {/* Sub-Tab Switcher: Messages vs Polls */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setChatTab('messages')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              chatTab === 'messages' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Messages
          </button>
          <button
            onClick={() => setChatTab('polls')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              chatTab === 'polls' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Vote className="w-3.5 h-3.5 text-emerald-600" /> Live Polls
          </button>
        </div>
      </div>

      {chatTab === 'polls' ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 bg-slate-50/40">
          <LivePollsView tripId={tripId} isAdmin={isAdmin} currentUserId={currentUser.id} />
        </div>
      ) : (
        <>
          {/* 2. Messages List (Scrollable Center Area) */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40 relative"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs font-medium">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">No messages yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Start the discussion with fellow trip members!
            </p>
          </div>
        ) : (
          groupedMessages.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              {/* Date Section Header */}
              <div className="flex items-center justify-center my-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/90 border border-slate-200/80 px-3 py-0.5 rounded-full shadow-xs">
                  {group.dateHeader}
                </span>
              </div>

              {/* Group Messages */}
              {group.msgs.map((msg, msgIdx) => {
                const isMe = msg.senderId === currentUser.id;
                const prevMsg = msgIdx > 0 ? group.msgs[msgIdx - 1] : null;
                const isSameSender = prevMsg && prevMsg.senderId === msg.senderId;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} ${
                      isSameSender ? 'mt-1' : 'mt-3'
                    }`}
                  >
                    {!isMe && (
                      <div className="w-7 shrink-0">
                        {!isSameSender && <Avatar name={msg.sender?.name || 'Member'} size="sm" />}
                      </div>
                    )}

                    <div className="max-w-[78%] sm:max-w-[70%] space-y-0.5">
                      {!isMe && !isSameSender && (
                        <span className="text-[10px] font-bold text-slate-500 block px-1">
                          {msg.sender?.name}
                        </span>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-tr-xs font-medium'
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <span
                          className={`text-[9px] block text-right mt-1 font-semibold ${
                            isMe ? 'text-emerald-100/90' : 'text-slate-400'
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Floating New Messages Indicator */}
        {hasUnreadBelow && (
          <button
            onClick={() => scrollToBottom(true)}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 z-20 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-3.5 rounded-full shadow-lg transition-all flex items-center gap-1.5 cursor-pointer animate-bounce"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>New messages below</span>
          </button>
        )}
      </div>

      {/* 3. Input Footer (Fixed Bottom) */}
      <form
        onSubmit={handleSend}
        className="shrink-0 p-3 sm:p-3.5 bg-white border-t border-slate-200/80 flex items-end gap-2"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift + Enter for new line)"
          className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white font-medium text-slate-900 resize-none max-h-30 leading-relaxed no-scrollbar"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 self-end h-[38px] cursor-pointer"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </form>
        </>
      )}
    </div>
  );
});
