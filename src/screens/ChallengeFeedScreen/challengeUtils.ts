import type { Task, UserTaskStatus } from '../../types/api';

/** The three feed buckets shown by the segmented control. */
export type FeedBucket = 'incoming' | 'active' | 'completed';

/**
 * Maps a real `UserTaskStatus` onto one of the feed's three buckets.
 *
 * The mockup's "Incoming / Active / Completed" tabs are mapped honestly onto
 * the real task lifecycle rather than inventing a parallel model:
 *   - incoming  → `Invited`  (a shared task awaiting an accept/decline)
 *   - active    → `Open`, `Accepted`, `Submitted`, `Rejected` (in flight)
 *   - completed → `Approved`, `Declined`, `Cancelled` (terminal / closed)
 */
export function statusBucket(status: UserTaskStatus): FeedBucket {
  switch (status) {
    case 'Invited':
      return 'incoming';
    case 'Approved':
    case 'Declined':
    case 'Cancelled':
      return 'completed';
    default:
      return 'active';
  }
}

/** Groups a task list into the three buckets, preserving order. */
export function bucketTasks(tasks: Task[]): Record<FeedBucket, Task[]> {
  const groups: Record<FeedBucket, Task[]> = { incoming: [], active: [], completed: [] };
  tasks.forEach((task) => {
    groups[statusBucket(task.status)].push(task);
  });
  return groups;
}

/** Human-friendly label for a task's lifecycle status. */
export function statusLabel(status: UserTaskStatus): string {
  switch (status) {
    case 'Open':
      return 'Not sent yet';
    case 'Invited':
      return 'Awaiting reply';
    case 'Accepted':
      return 'In progress';
    case 'Submitted':
      return 'Awaiting review';
    case 'Rejected':
      return 'Needs resubmission';
    case 'Approved':
      return 'Completed';
    case 'Declined':
      return 'Declined';
    case 'Cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

/**
 * Relative deadline text from an ISO due date, computed against `now`.
 * Returns null when there is no deadline.
 */
export function formatDeadline(dueAt: string | null, now: number = Date.now()): string | null {
  if (!dueAt) return null;
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.ceil((due - now) / dayMs);
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return '1 day left';
  return `${diffDays} days left`;
}

/** True when the deadline is close enough to warrant a warning colour. */
export function isDeadlineSoon(dueAt: string | null, now: number = Date.now()): boolean {
  const text = formatDeadline(dueAt, now);
  if (!text) return false;
  return text === 'Overdue' || text === 'Due today' || text === '1 day left';
}

const EMOJI_POOL = ['🏔️', '🌿', '🤝', '☕', '📸', '🎯', '✨', '🚵', '📖', '🎨'];

/** Deterministic emoji for a task, derived from its id (no data implied). */
export function pickEmoji(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % EMOJI_POOL.length;
  }
  return EMOJI_POOL[hash];
}
