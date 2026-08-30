'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { MessageDetail, UserSummary } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatTime } from '@/lib/utils';
import { LivePollsView } from '@/components/trip/LivePollsView';
import {
  Send,
  MessageSquare,
  ArrowDown,
  Loader2,
  Vote,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

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

  // Edit & Unsend state
  const [editingMessage, setEditingMessage] = useState<MessageDetail | null>(null);
  const [unsendConfirmMessage, setUnsendConfirmMessage] = useState<MessageDetail | null>(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const isNearBottomRef = useRef(true);

  // Close message dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuMsgId(null);
      }
    };
    if (activeMenuMsgId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuMsgId]);

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
                const index = prev.findIndex((m) => m.id === newMsg.id);
                if (index >= 0) {
                  const updated = [...prev];
                  updated[index] = newMsg;
                  return updated;
                }
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
        const res = await fetch(`/api/trips/${tripId}/messages?limit=30`);
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

  // Check action permissions (5 mins for Edit, 10 mins for Unsend)
  const canEditMessage = (msg: MessageDetail) => {
    if (msg.senderId !== currentUser.id || msg.isUnsent) return false;
    const elapsed = Date.now() - new Date(msg.createdAt).getTime();
    return elapsed <= 5 * 60 * 1000;
  };

  const canUnsendMessage = (msg: MessageDetail) => {
    if (msg.senderId !== currentUser.id || msg.isUnsent) return false;
    const elapsed = Date.now() - new Date(msg.createdAt).getTime();
    return elapsed <= 10 * 60 * 1000;
  };

  const handleStartEdit = (msg: MessageDetail) => {
    setActiveMenuMsgId(null);
    setEditingMessage(msg);
    setInputText(msg.content);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight();
      }
    }, 50);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);

    if (editingMessage) {
      // Edit existing message
      try {
        const res = await fetch(`/api/trips/${tripId}/messages/${editingMessage.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        });
        const data = await res.json();
        if (res.ok && data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === data.message.id ? data.message : m))
          );
          setEditingMessage(null);
          setInputText('');
          if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
      } catch (err) {
        console.error('Failed to edit message:', err);
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Send new message
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

  const handleConfirmUnsend = async () => {
    if (!unsendConfirmMessage || isActionLoading) return;
    setIsActionLoading(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/messages/${unsendConfirmMessage.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.message.id ? data.message : m))
        );
        setUnsendConfirmMessage(null);
      }
    } catch (err) {
      console.error('Failed to unsend message:', err);
    } finally {
      setIsActionLoading(false);
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
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden touch-none">
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

                    const showEdit = canEditMessage(msg);
                    const showUnsend = canUnsendMessage(msg);
                    const hasActions = isMe && !msg.isUnsent && (showEdit || showUnsend);
                    const isMenuOpen = activeMenuMsgId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2.5 group relative ${isMe ? 'justify-end' : 'justify-start'} ${
                          isSameSender ? 'mt-1' : 'mt-3'
                        }`}
                      >
                        {!isMe && (
                          <div className="w-7 shrink-0">
                            {!isSameSender && <Avatar name={msg.sender?.name || 'Member'} size="sm" />}
                          </div>
                        )}

                        <div className="max-w-[78%] sm:max-w-[70%] space-y-0.5 relative">
                          {!isMe && !isSameSender && (
                            <span className="text-[10px] font-bold text-slate-500 block px-1">
                              {msg.sender?.name}
                            </span>
                          )}

                          {/* Message Bubble + Action Button Container */}
                          <div className="relative group/bubble flex items-center gap-1.5">
                            {/* 3-Dot Action Trigger for own messages */}
                            {isMe && hasActions && (
                              <div className="relative shrink-0" ref={isMenuOpen ? menuRef : null}>
                                <button
                                  type="button"
                                  onClick={() => setActiveMenuMsgId(isMenuOpen ? null : msg.id)}
                                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 opacity-0 group-hover/bubble:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                                  title="Message actions"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                  <div className="absolute right-0 top-6 w-32 bg-white rounded-xl shadow-lg border border-slate-100 p-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                                    {showEdit && (
                                      <button
                                        type="button"
                                        onClick={() => handleStartEdit(msg)}
                                        className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <Pencil className="w-3 h-3 text-slate-500" />
                                        <span>Edit</span>
                                      </button>
                                    )}
                                    {showUnsend && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuMsgId(null);
                                          setUnsendConfirmMessage(msg);
                                        }}
                                        className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="w-3 h-3 text-rose-500" />
                                        <span>Unsend</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Message Bubble Body */}
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                                msg.isUnsent
                                  ? 'bg-slate-100 text-slate-400 italic rounded-tl-xs border border-slate-200/60'
                                  : isMe
                                  ? 'bg-emerald-600 text-white rounded-tr-xs font-medium'
                                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                              }`}
                            >
                              {msg.isUnsent ? (
                                <p className="italic text-slate-400 text-xs">Message unsent</p>
                              ) : (
                                <>
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                  <div
                                    className={`flex items-center justify-end gap-1 mt-1 font-semibold text-[9px] ${
                                      isMe ? 'text-emerald-100/90' : 'text-slate-400'
                                    }`}
                                  >
                                    {msg.isEdited && <span className="italic">(edited)</span>}
                                    <span>{formatTime(msg.createdAt)}</span>
                                  </div>
                                </>
                              )}
                            </div>
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
          <div className="shrink-0 bg-white border-t border-slate-200/80 z-10">
            {/* Editing Message Banner */}
            {editingMessage && (
              <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold truncate">
                  <Pencil className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Editing message: &ldquo;{editingMessage.content}&rdquo;</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-1 text-emerald-700 hover:text-emerald-900 rounded-full shrink-0 cursor-pointer"
                  title="Cancel edit"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="p-3 sm:p-3.5 flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
                className="flex-1 px-3.5 py-2.5 text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white font-medium text-slate-900 resize-none max-h-30 leading-relaxed no-scrollbar touch-manipulation"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 self-end h-[40px] cursor-pointer"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{editingMessage ? 'Save' : 'Send'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Unsend Confirmation Modal */}
      {unsendConfirmMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-2xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Unsend Message?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This message will be un-sent for everyone in the group. You cannot undo this action.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUnsendConfirmMessage(null)}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnsend}
                disabled={isActionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Unsend Message'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
