'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageDetail, UserSummary } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatTime } from '@/lib/utils';
import { Send, MessageSquare } from 'lucide-react';

interface GroupChatViewProps {
  tripId: string;
  tripName: string;
  currentUser: UserSummary;
}

export const GroupChatView: React.FC<GroupChatViewProps> = React.memo(({ tripId, tripName, currentUser }) => {
  const [messages, setMessages] = useState<MessageDetail[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!tripId) return;

    let socket: Socket;

    const initChat = async () => {
      setIsLoading(true);

      // 1. Ensure Socket.IO server is initialized on Next.js HTTP server
      try {
        await fetch('/api/socket/io');
      } catch (err) {
        console.error('Failed to initialize socket route:', err);
      }

      // 2. Fetch existing messages for initial load
      try {
        const res = await fetch(`/api/trips/${tripId}/messages`);
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to load initial messages:', err);
      } finally {
        setIsLoading(false);
      }

      // 3. Connect Socket.IO
      socket = io({
        path: '/api/socket/io',
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      if (socket.connected) {
        socket.emit('join_trip', tripId);
      }

      socket.on('connect', () => {
        socket.emit('join_trip', tripId);
      });

      socket.on('new_message', (newMsg: MessageDetail) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });
    };

    initChat();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [tripId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setInputText('');

    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        tripId,
        senderId: currentUser.id,
        message: text,
      });
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
      }
    } catch (err) {
      console.error('Failed REST message fallback:', err);
    }
  };

  return (
    <div className="flex flex-col h-[550px] max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900">{tripName} Chat</h4>
          <p className="text-[10px] text-slate-400">Group messaging</p>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
        {isLoading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            No messages yet. Send a message to start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && <Avatar name={msg.sender?.name || 'Member'} size="sm" />}
                <div className="max-w-[75%] space-y-0.5">
                  {!isMe && (
                    <span className="text-[10px] font-bold text-slate-400 block px-1">
                      {msg.sender?.name}
                    </span>
                  )}
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed break-words ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p>{msg.content}</p>
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

      {/* Input Footer */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
});
