'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageDetail } from '@/types';

export function useSocket(tripId: string, currentUserId: string) {
  const [messages, setMessages] = useState<MessageDetail[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // 1. Initial REST fetch for chat history
  const fetchInitialMessages = useCallback(async () => {
    if (!tripId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/messages?limit=50`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load messages');

      setMessages(data.messages || []);
      setHasMore(!!data.hasMore);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  // 2. Fetch older messages for infinite scroll pagination
  const loadMoreMessages = useCallback(async () => {
    if (!tripId || isLoadingMore || !hasMore || messages.length === 0) return;
    setIsLoadingMore(true);
    try {
      const oldestMessageId = messages[0].id;
      const res = await fetch(`/api/trips/${tripId}/messages?limit=30&before=${oldestMessageId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load older messages');

      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => [...data.messages, ...prev]);
      }
      setHasMore(!!data.hasMore);
    } catch (err: any) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [tripId, isLoadingMore, hasMore, messages]);

  // 3. Socket.IO connection and room management
  useEffect(() => {
    if (!tripId) return;

    fetchInitialMessages();

    // Initialize socket connection
    const socket: Socket = io({
      path: '/api/socket/io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      // Join trip room
      socket.emit('join_trip', { tripId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err: Error) => {
      setIsConnected(false);
      setError('Real-time connection warning. Reconnecting...');
    });

    socket.on('new_message', (newMsg: MessageDetail) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    socket.on('message_error', (data: { error: string }) => {
      setError(data.error || 'Message error');
    });

    return () => {
      socket.emit('leave_trip', { tripId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tripId, fetchInitialMessages]);

  // 4. Send Message function (Socket with REST fallback)
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !tripId) return;

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', { tripId, content: trimmed });
      } else {
        // Fallback to REST API if socket is temporarily disconnected
        try {
          const res = await fetch(`/api/trips/${tripId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: trimmed }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to send message');

          if (data.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
          }
        } catch (err: any) {
          setError(err.message || 'Failed to send message');
        }
      }
    },
    [tripId]
  );

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    sendMessage,
    loadMoreMessages,
    dismissError,
    refetchMessages: fetchInitialMessages,
  };
}
