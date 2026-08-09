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

  cachedSessionPromise = fetch('/api/auth/me')
    .then(async (res) => {
      if (!res.ok) {
        cachedSessionData = null;
        return null;
      }
      const data = await res.json();
      cachedSessionData = data.user || null;
      return cachedSessionData;
    })
    .catch(() => {
      cachedSessionData = null;
      return null;
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
