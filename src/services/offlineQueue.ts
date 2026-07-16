import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { generateUuid } from '../utils/uuid';
import { ApiError } from './apiClient';
import {
  acceptTaskInvite,
  createTask,
  declineTaskInvite,
  reviewTaskSubmission,
} from './tasksApi';
import { saveMission, unsaveMission } from './missionsApi';
import { submitPhotoProof, submitTextProof } from './proofApi';
import type { CreateTaskRequest, ReviewSubmissionRequest } from '../types/api';

/**
 * Local write-ahead queue (M23.3 + M23.4). A dedicated queue rather than
 * TanStack Query's persisted-mutation replay, because this app's proof/evidence
 * uploads build a real `Blob` at submit time (see `proofApi.ts`) and a `Blob`
 * cannot survive JSON serialization across an app restart. So a queued
 * file-upload stores the raw file *URI*, and the Blob is re-materialized at
 * replay time by calling the exact same api function a live submission uses —
 * one code path for both, not two to keep in sync.
 *
 * The queue holds at most a handful of items on a phone, so a serialized array
 * in AsyncStorage is sufficient — no SQLite dependency needed. Each
 * item's `id` doubles as its `Idempotency-Key`: a UUID minted once at enqueue
 * and reused on every retry, so a mutation the server already processed (but
 * whose response never reached us) returns its original result instead of
 * re-executing — critical for proof submission, which would otherwise
 * double-award XP.
 */

export const OFFLINE_QUEUE_STORAGE_KEY = 'sidequest:offline-queue';

/** How many failed attempts before an item stops auto-retrying (manual retry still works). */
export const MAX_AUTO_RETRIES = 5;

export type QueueItemStatus = 'pending' | 'processing' | 'failed';

/**
 * The set of mutations safe to queue. Save/unsave are already idempotent
 * server-side (POST/DELETE `/save` are no-ops when repeated) so they carry no
 * key; the rest thread the item id as an `Idempotency-Key`.
 */
export type QueuedInput =
  | { type: 'task.create'; payload: { body: CreateTaskRequest } }
  | { type: 'task.invite.accept'; payload: { token: string } }
  | { type: 'task.invite.decline'; payload: { token: string } }
  | {
      type: 'task.submission.review';
      payload: { taskId: string; submissionId: string; body: ReviewSubmissionRequest };
    }
  | { type: 'mission.save'; payload: { missionId: string } }
  | { type: 'mission.unsave'; payload: { missionId: string } }
  | { type: 'mission.proof.photo'; payload: { missionId: string; photoUri: string } }
  | { type: 'mission.proof.text'; payload: { missionId: string; caption: string } };

export type QueuedMutationType = QueuedInput['type'];

interface QueueItemMeta {
  id: string;
  createdAt: number;
  retryCount: number;
  status: QueueItemStatus;
}

export type QueuedMutation = QueueItemMeta & QueuedInput;

/** Immutable view of queue state, handed to UI subscribers. */
export interface QueueSnapshot {
  items: QueuedMutation[];
  pending: number;
  failed: number;
  isSyncing: boolean;
}

type Listener = (snapshot: QueueSnapshot) => void;

/** Human-readable labels for the sync indicator / logs. */
export const MUTATION_LABELS: Record<QueuedMutationType, string> = {
  'task.create': 'Create challenge',
  'task.invite.accept': 'Accept invite',
  'task.invite.decline': 'Decline invite',
  'task.submission.review': 'Review submission',
  'mission.save': 'Save quest',
  'mission.unsave': 'Unsave quest',
  'mission.proof.photo': 'Submit photo proof',
  'mission.proof.text': 'Submit proof',
};

/**
 * Replays a single queued mutation through the same api function a live call
 * uses, passing the item id as the idempotency key where the endpoint supports
 * it. The `switch` is exhaustive over `QueuedInput`, so adding a new mutation
 * type is a compile error until it's handled here.
 */
export function runQueuedMutation(item: QueuedMutation): Promise<unknown> {
  switch (item.type) {
    case 'task.create':
      return createTask(item.payload.body, item.id);
    case 'task.invite.accept':
      return acceptTaskInvite(item.payload.token, item.id);
    case 'task.invite.decline':
      return declineTaskInvite(item.payload.token, item.id);
    case 'task.submission.review':
      return reviewTaskSubmission(
        item.payload.taskId,
        item.payload.submissionId,
        item.payload.body,
        item.id,
      );
    case 'mission.save':
      return saveMission(item.payload.missionId);
    case 'mission.unsave':
      return unsaveMission(item.payload.missionId);
    case 'mission.proof.photo':
      return submitPhotoProof(item.payload.missionId, item.payload.photoUri, item.id);
    case 'mission.proof.text':
      return submitTextProof(item.payload.missionId, item.payload.caption, item.id);
  }
}

export class OfflineQueue {
  private items: QueuedMutation[] = [];
  private listeners = new Set<Listener>();
  private loaded = false;
  private draining = false;

  /** Hydrates the in-memory queue from AsyncStorage. Idempotent. */
  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as QueuedMutation[];
        // Anything left `processing` from a hard kill mid-flight is reset to
        // pending so it's retried rather than stuck.
        this.items = parsed.map((item) =>
          item.status === 'processing' ? { ...item, status: 'pending' } : item,
        );
      }
    } catch {
      // A corrupt cache should never brick the app — start from empty.
      this.items = [];
    }
    this.loaded = true;
    this.emit();
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(this.items));
    } catch {
      // Best-effort: an AsyncStorage write failure must not throw into a
      // caller mid-mutation. The in-memory queue is still authoritative for
      // this session.
    }
  }

  /** Current immutable snapshot for subscribers. */
  snapshot(): QueueSnapshot {
    return {
      items: this.items.map((item) => ({ ...item })),
      pending: this.items.filter((i) => i.status !== 'failed').length,
      failed: this.items.filter((i) => i.status === 'failed').length,
      isSyncing: this.draining,
    };
  }

  private emit(): void {
    const snap = this.snapshot();
    this.listeners.forEach((listener) => listener(snap));
  }

  /** Subscribe to queue changes; returns an unsubscribe fn. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Appends a mutation and kicks off a drain attempt (a no-op while offline). */
  async enqueue(input: QueuedInput): Promise<QueuedMutation> {
    await this.load();
    const item: QueuedMutation = {
      id: generateUuid(),
      createdAt: Date.now(),
      retryCount: 0,
      status: 'pending',
      ...input,
    };
    this.items.push(item);
    await this.persist();
    this.emit();
    // Attempt an immediate drain so an online enqueue syncs right away; while
    // offline this no-ops (the NetInfo guard in `drain`) and the item simply
    // stays pending until the next reconnect/foreground drain. Awaited so the
    // caller's mutation reflects the real attempt (and for deterministic tests).
    await this.drain();
    return item;
  }

  /**
   * Processes every non-processing item in FIFO order. Skips entirely while
   * offline (leaving items `pending`, not `failed`, so the UI reads "N pending"
   * rather than a scary failure). Guarded against re-entrancy.
   */
  async drain(): Promise<void> {
    await this.load();
    if (this.draining) return;

    const net = await NetInfo.fetch();
    if (net.isConnected === false) return;

    this.draining = true;
    this.emit();
    try {
      for (const item of [...this.items]) {
        if (item.status === 'processing') continue;
        if (item.status === 'failed' && item.retryCount >= MAX_AUTO_RETRIES) continue;
        await this.process(item);
      }
    } finally {
      this.draining = false;
      this.emit();
    }
  }

  private async process(item: QueuedMutation): Promise<void> {
    item.status = 'processing';
    await this.persist();
    this.emit();
    try {
      await runQueuedMutation(item);
      this.items = this.items.filter((i) => i.id !== item.id);
    } catch (error) {
      // A genuine server rejection (ApiError with an HTTP status — 400/403/
      // 409/etc.) burns a retry attempt toward the failed cap. A plain
      // connectivity drop mid-drain (fetch throwing before any response, e.g.
      // reconnect flickers offline again while this item is uploading) is NOT
      // the same thing and must not burn the retry budget — the very next
      // reconnect/foreground drain should retry it exactly as if this attempt
      // never happened. Found missing by independent review: the previous
      // unconditional `catch {}` treated both identically, so a few
      // connectivity flickers during a large-file upload could exhaust
      // MAX_AUTO_RETRIES and land the item in the tap-to-retry `failed` state
      // for something the server never actually rejected.
      if (error instanceof ApiError) {
        item.retryCount += 1;
      }
      // Below the cap we keep it `pending` so a later reconnect/foreground
      // drain retries it automatically; at the cap it becomes `failed`, which
      // the sync indicator surfaces as tap-to-retry.
      item.status = item.retryCount >= MAX_AUTO_RETRIES ? 'failed' : 'pending';
    }
    await this.persist();
    this.emit();
  }

  /** Resets one failed item and drains — the sync indicator's tap-to-retry. */
  async retry(id: string): Promise<void> {
    await this.load();
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.status = 'pending';
      item.retryCount = 0;
      await this.persist();
      this.emit();
    }
    await this.drain();
  }

  /** Resets all failed items and drains. */
  async retryAll(): Promise<void> {
    await this.load();
    this.items.forEach((item) => {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.retryCount = 0;
      }
    });
    await this.persist();
    this.emit();
    await this.drain();
  }

  /** Test/utility hook: wipe the queue entirely. */
  async clear(): Promise<void> {
    this.items = [];
    this.loaded = true;
    await this.persist();
    this.emit();
  }
}

/** App-wide singleton. */
export const offlineQueue = new OfflineQueue();
