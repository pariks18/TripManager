import { UserSession } from '@/types';

let cachedSessionPromise: Promise<UserSession | null> | null = null;
let cachedSessionData: UserSession | null = null;

export async function fetchClientSession(forceRefresh: boolean = false): Promise<UserSession | null> {
  if (!forceRefresh && cachedSessionData) {
    return cachedSessionData;
  }

  if (!forceRefresh && cachedSessionPromise) {
    return cachedSessionPromise;
  }

  cachedSessionPromise = fetch('/api/auth/me', {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  })
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 401) {
          cachedSessionData = null;
        }
        return cachedSessionData;
      }
      const data = await res.json();
      cachedSessionData = data.user || null;
      return cachedSessionData;
    })
    .catch(() => {
      return cachedSessionData;
    })
    .finally(() => {
      cachedSessionPromise = null;
    });

  return cachedSessionPromise;
}

export function clearClientSession() {
  cachedSessionPromise = null;
  cachedSessionData = null;
}
