import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  OfflineQueue,
  OFFLINE_QUEUE_STORAGE_KEY,
  MAX_AUTO_RETRIES,
  MUTATION_LABELS,
  runQueuedMutation,
  type QueuedMutation,
} from './offlineQueue';
import { createTask, acceptTaskInvite, declineTaskInvite, reviewTaskSubmission } from './tasksApi';
import { saveMission, unsaveMission } from './missionsApi';
import { submitPhotoProof, submitTextProof } from './proofApi';
import { ApiError } from './apiClient';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn() },
}));
jest.mock('./tasksApi');
jest.mock('./missionsApi');
jest.mock('./proofApi');
jest.mock('../utils/uuid', () => {
  let n = 0;
  return { generateUuid: jest.fn(() => `id-${(n += 1)}`) };
});

const mockNetFetch = NetInfo.fetch as jest.Mock;

/** In-memory AsyncStorage so persistence round-trips within a test. */
function seedStorage(store: Record<string, string>): void {
  (AsyncStorage.getItem as jest.Mock).mockImplementation((k: string) =>
    Promise.resolve(store[k] ?? null),
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation((k: string, v: string) => {
    store[k] = v;
    return Promise.resolve();
  });
}

describe('offlineQueue', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = {};
    seedStorage(store);
    mockNetFetch.mockResolvedValue({ isConnected: true });
    (createTask as jest.Mock).mockResolvedValue({ id: 't1' });
    (acceptTaskInvite as jest.Mock).mockResolvedValue({ id: 't1' });
    (declineTaskInvite as jest.Mock).mockResolvedValue({ id: 't1' });
    (reviewTaskSubmission as jest.Mock).mockResolvedValue({ id: 't1' });
    (saveMission as jest.Mock).mockResolvedValue({ saved: true });
    (unsaveMission as jest.Mock).mockResolvedValue({ saved: false });
    (submitPhotoProof as jest.Mock).mockResolvedValue({ completionId: 'c1' });
    (submitTextProof as jest.Mock).mockResolvedValue({ completionId: 'c1' });
  });

  describe('runQueuedMutation', () => {
    function item(over: Partial<QueuedMutation>): QueuedMutation {
      return {
        id: 'k',
        createdAt: 0,
        retryCount: 0,
        status: 'pending',
        type: 'mission.save',
        payload: { missionId: 'm1' },
        ...over,
      } as QueuedMutation;
    }

    it('routes each type to the matching api function with the item id as key', async () => {
      await runQueuedMutation(item({ type: 'task.create', payload: { body: { title: 'x' } } }));
      expect(createTask).toHaveBeenCalledWith({ title: 'x' }, 'k');

      await runQueuedMutation(item({ type: 'task.invite.accept', payload: { token: 'tok' } }));
      expect(acceptTaskInvite).toHaveBeenCalledWith('tok', 'k');

      await runQueuedMutation(item({ type: 'task.invite.decline', payload: { token: 'tok' } }));
      expect(declineTaskInvite).toHaveBeenCalledWith('tok', 'k');

      await runQueuedMutation(
        item({
          type: 'task.submission.review',
          payload: { taskId: 't', submissionId: 's', body: { decision: 'Approve' } },
        }),
      );
      expect(reviewTaskSubmission).toHaveBeenCalledWith('t', 's', { decision: 'Approve' }, 'k');

      await runQueuedMutation(item({ type: 'mission.save', payload: { missionId: 'm1' } }));
      expect(saveMission).toHaveBeenCalledWith('m1');

      await runQueuedMutation(item({ type: 'mission.unsave', payload: { missionId: 'm1' } }));
      expect(unsaveMission).toHaveBeenCalledWith('m1');

      await runQueuedMutation(
        item({ type: 'mission.proof.photo', payload: { missionId: 'm1', photoUri: 'file://p' } }),
      );
      expect(submitPhotoProof).toHaveBeenCalledWith('m1', 'file://p', 'k');

      await runQueuedMutation(
        item({ type: 'mission.proof.text', payload: { missionId: 'm1', caption: 'hi' } }),
      );
      expect(submitTextProof).toHaveBeenCalledWith('m1', 'hi', 'k');
    });
  });

  describe('enqueue + drain (online)', () => {
    it('enqueues, persists, drains immediately, and removes on success', async () => {
      const q = new OfflineQueue();
      await q.enqueue({ type: 'mission.save', payload: { missionId: 'm1' } });

      expect(saveMission).toHaveBeenCalledWith('m1');
      expect(q.snapshot().items).toHaveLength(0);
      expect(store[OFFLINE_QUEUE_STORAGE_KEY]).toBe('[]');
    });

    it('drains a photo proof by re-materializing from the stored URI, keyed by item id', async () => {
      const q = new OfflineQueue();
      const item = await q.enqueue({
        type: 'mission.proof.photo',
        payload: { missionId: 'm1', photoUri: 'file:///tmp/p.jpg' },
      });
      expect(submitPhotoProof).toHaveBeenCalledWith('m1', 'file:///tmp/p.jpg', item.id);
      expect(q.snapshot().items).toHaveLength(0);
    });
  });

  describe('offline behaviour', () => {
    it('leaves items pending (not failed) while offline', async () => {
      mockNetFetch.mockResolvedValue({ isConnected: false });
      const q = new OfflineQueue();
      await q.enqueue({ type: 'mission.save', payload: { missionId: 'm1' } });
      await q.drain();

      expect(saveMission).not.toHaveBeenCalled();
      const snap = q.snapshot();
      expect(snap.pending).toBe(1);
      expect(snap.failed).toBe(0);
      expect(snap.items[0].status).toBe('pending');
    });
  });

  describe('failure + retry', () => {
    /** What a genuine server rejection looks like — the class that must burn a retry attempt. */
    function serverRejection(status = 400): ApiError {
      return new ApiError(status, { statusCode: status, timestamp: '', path: '', message: 'rejected' });
    }

    it('keeps an item pending under the retry cap and marks it failed at the cap (server rejection)', async () => {
      (saveMission as jest.Mock).mockRejectedValue(serverRejection());
      const q = new OfflineQueue();
      await q.enqueue({ type: 'mission.save', payload: { missionId: 'm1' } });

      // First drain already ran via enqueue -> retryCount 1, still pending.
      await q.drain();
      let snap = q.snapshot();
      expect(snap.items[0].retryCount).toBeGreaterThanOrEqual(1);

      // Drain until it hits the cap.
      for (let i = 0; i < MAX_AUTO_RETRIES + 2; i += 1) {
        await q.drain();
      }
      snap = q.snapshot();
      expect(snap.items[0].status).toBe('failed');
      expect(snap.failed).toBe(1);
      expect(snap.items[0].retryCount).toBeGreaterThanOrEqual(MAX_AUTO_RETRIES);
    });

    it('does not auto-retry a failed item past the cap, but retry() resets and reruns it', async () => {
      (saveMission as jest.Mock).mockRejectedValue(serverRejection());
      const q = new OfflineQueue();
      const item = await q.enqueue({ type: 'mission.save', payload: { missionId: 'm1' } });
      for (let i = 0; i < MAX_AUTO_RETRIES + 2; i += 1) await q.drain();
      expect(q.snapshot().items[0].status).toBe('failed');

      const callsAtFailure = (saveMission as jest.Mock).mock.calls.length;
      await q.drain(); // capped failed item is skipped
      expect((saveMission as jest.Mock).mock.calls.length).toBe(callsAtFailure);

      (saveMission as jest.Mock).mockResolvedValueOnce({ saved: true });
      await q.retry(item.id);
      expect(q.snapshot().items).toHaveLength(0);
    });

    it('retryAll resets every failed item and drains', async () => {
      (saveMission as jest.Mock).mockRejectedValue(serverRejection());
      const q = new OfflineQueue();
      await q.enqueue({ type: 'mission.save', payload: { missionId: 'm1' } });
      for (let i = 0; i < MAX_AUTO_RETRIES + 2; i += 1) await q.drain();
      expect(q.snapshot().failed).toBe(1);

      (saveMission as jest.Mock).mockResolvedValue({ saved: true });
      await q.retryAll();
      expect(q.snapshot().items).toHaveLength(0);
    });

    it('does not burn a retry attempt on a plain connectivity drop (regression)', async () => {
      // Independent review found the original catch{} treated a mid-drain
      // network drop (fetch throwing before any response — not an ApiError)
      // identically to a genuine server rejection, so a few connectivity
      // flickers during a large upload could exhaust MAX_AUTO_RETRIES and
      // land the item in the tap-to-retry "failed" state for something the
      // server never actually rejected.
      (saveMission as jest.Mock).mockRejectedValue(new TypeError('Network request failed'));
      const q = new OfflineQueue();
      await q.enqueue({ type: 'mission.save', payload: { missionId: 'm1' } });

      // Drain far past what would exhaust the cap for a real rejection —
      // retryCount must never move and the item must stay pending, not failed.
      for (let i = 0; i < MAX_AUTO_RETRIES + 5; i += 1) {
        await q.drain();
      }
      const snap = q.snapshot();
      expect(snap.items[0].retryCount).toBe(0);
      expect(snap.items[0].status).toBe('pending');
      expect(snap.failed).toBe(0);
    });

    it('does burn a retry attempt on a genuine server rejection, distinguishing it from a network drop', async () => {
      (saveMission as jest.Mock).mockRejectedValue(serverRejection(403));
      const q = new OfflineQueue();
      await q.enqueue({ type: 'mission.save', payload: { missionId: 'm1' } });
      await q.drain();
      expect(q.snapshot().items[0].retryCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('persistence + subscription', () => {
    it('hydrates a persisted queue and resets a stuck processing item to pending', async () => {
      store[OFFLINE_QUEUE_STORAGE_KEY] = JSON.stringify([
        {
          id: 'x',
          createdAt: 1,
          retryCount: 0,
          status: 'processing',
          type: 'mission.save',
          payload: { missionId: 'm1' },
        },
      ]);
      mockNetFetch.mockResolvedValue({ isConnected: false }); // avoid auto-drain
      const q = new OfflineQueue();
      await q.load();
      expect(q.snapshot().items[0].status).toBe('pending');
    });

    it('starts empty when the stored payload is corrupt', async () => {
      store[OFFLINE_QUEUE_STORAGE_KEY] = '{not json';
      const q = new OfflineQueue();
      await q.load();
      expect(q.snapshot().items).toHaveLength(0);
    });

    it('notifies subscribers on change and stops after unsubscribe', async () => {
      mockNetFetch.mockResolvedValue({ isConnected: false });
      const q = new OfflineQueue();
      const listener = jest.fn();
      const unsub = q.subscribe(listener);
      expect(listener).toHaveBeenCalledTimes(1); // immediate snapshot
      await q.enqueue({ type: 'mission.save', payload: { missionId: 'm1' } });
      expect(listener.mock.calls.length).toBeGreaterThan(1);
      const countAtUnsub = listener.mock.calls.length;
      unsub();
      await q.clear();
      expect(listener.mock.calls.length).toBe(countAtUnsub);
    });

    it('is resilient to an AsyncStorage write failure', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('disk full'));
      const q = new OfflineQueue();
      await expect(
        q.enqueue({ type: 'mission.save', payload: { missionId: 'm1' } }),
      ).resolves.toBeDefined();
    });
  });

  it('exposes a human label for every mutation type', () => {
    expect(MUTATION_LABELS['mission.proof.photo']).toBe('Submit photo proof');
    expect(Object.keys(MUTATION_LABELS)).toHaveLength(8);
  });
});
