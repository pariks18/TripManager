import { MessageDetail } from '@/types';

// In-memory stream subscriber registry by tripId
const tripSubscribers = new Map<string, Set<(message: MessageDetail) => void>>();

export function addSubscriber(tripId: string, send: (message: MessageDetail) => void) {
  if (!tripSubscribers.has(tripId)) {
    tripSubscribers.set(tripId, new Set());
  }
  tripSubscribers.get(tripId)!.add(send);
}

export function removeSubscriber(tripId: string, send: (message: MessageDetail) => void) {
  const subs = tripSubscribers.get(tripId);
  if (subs) {
    subs.delete(send);
    if (subs.size === 0) {
      tripSubscribers.delete(tripId);
    }
  }
}

export function broadcastTripMessage(tripId: string, message: MessageDetail) {
  const subscribers = tripSubscribers.get(tripId);
  if (subscribers && subscribers.size > 0) {
    subscribers.forEach((send) => {
      try {
        send(message);
      } catch (err) {
        console.error('Error broadcasting message to stream subscriber:', err);
      }
    });
  }
}
