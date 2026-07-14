import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { offlineQueue } from '../services/offlineQueue';
import type { QueueSnapshot } from '../services/offlineQueue';
import { useOfflineStatus } from '../components/states/useOfflineStatus';

export interface UseOfflineQueueResult extends QueueSnapshot {
  /** True while the device has no connection. */
  offline: boolean;
  /** Reset all failed items and drain (sync indicator's tap-to-retry). */
  retryAll: () => void;
}

/**
 * Bridges the imperative `offlineQueue` singleton into React and owns the
 * drain triggers (M23.3): it drains whenever connectivity is restored (the
 * `useOfflineStatus()` flag flips back to online) and whenever the app returns
 * to the foreground. It also subscribes to the queue so any consumer re-renders
 * on pending/failed/syncing changes.
 */
export function useOfflineQueue(): UseOfflineQueueResult {
  const [snapshot, setSnapshot] = useState<QueueSnapshot>(() => offlineQueue.snapshot());
  const offline = useOfflineStatus();

  useEffect(() => {
    void offlineQueue.load();
    return offlineQueue.subscribe(setSnapshot);
  }, []);

  // Drain on initial mount-while-online and on every offline -> online flip.
  useEffect(() => {
    if (!offline) {
      void offlineQueue.drain();
    }
  }, [offline]);

  // Drain when the app is brought back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void offlineQueue.drain();
      }
    });
    return () => sub.remove();
  }, []);

  const retryAll = useCallback(() => {
    void offlineQueue.retryAll();
  }, []);

  return { ...snapshot, offline, retryAll };
}
