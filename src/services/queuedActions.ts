import { offlineQueue } from './offlineQueue';
import type { QueuedMutation } from './offlineQueue';

/**
 * Thin, screen-facing helpers that translate a UI action into a queued write.
 * Screens call these instead of the raw api functions so the action is durably
 * queued-and-retried rather than lost on a failed request (M23.3). Kept in its
 * own module so screens can mock the enqueue boundary in tests without pulling
 * in the whole queue/NetInfo/AsyncStorage stack.
 */

/** Queue a save/unsave toggle for a mission (upgrades the old direct call). */
export function enqueueSaveToggle(missionId: string, save: boolean): Promise<QueuedMutation> {
  return offlineQueue.enqueue(
    save
      ? { type: 'mission.save', payload: { missionId } }
      : { type: 'mission.unsave', payload: { missionId } },
  );
}

/**
 * Queue a mission proof submission (M23.4). Stores the raw photo *URI* (never a
 * pre-built Blob — a Blob can't survive JSON serialization across a restart);
 * the Blob is re-materialized at replay time by the same `proofApi` function a
 * live submission uses. The queued item's id becomes the `Idempotency-Key`, so
 * a replay the server already processed won't double-award XP.
 */
export function enqueueProofSubmission(
  mode: 'photo' | 'text',
  missionId: string,
  content: string,
): Promise<QueuedMutation> {
  return offlineQueue.enqueue(
    mode === 'photo'
      ? { type: 'mission.proof.photo', payload: { missionId, photoUri: content } }
      : { type: 'mission.proof.text', payload: { missionId, caption: content } },
  );
}
