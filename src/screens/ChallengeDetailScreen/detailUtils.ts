import type { Task, TaskDetail, TaskSubmission, UserTaskStatus } from '../../types/api';

/** The caller's relationship to a task. */
export type TaskRelationship = 'creator' | 'assignee' | 'observer';

/**
 * Semantic tone for a lifecycle status badge. Statuses map to the design
 * system's *status* colours by their real meaning (success/error/warning/info),
 * with the one genuinely social state — "awaiting a friend's reply" — carrying
 * the Community identity instead. Terminal-neutral states stay neutral rather
 * than borrowing an error/warning colour they don't warrant.
 */
export type StatusTone = 'success' | 'error' | 'warning' | 'info' | 'community' | 'neutral';

/** Maps a task's lifecycle status to its semantic badge tone. */
export function statusTone(status: UserTaskStatus): StatusTone {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
    case 'Declined':
      return 'error';
    case 'Open':
      return 'warning';
    case 'Invited':
      return 'community';
    case 'Accepted':
    case 'Submitted':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Determines whether the caller created, was assigned, or merely views a task. */
export function relationship(task: Task, userId: string | undefined): TaskRelationship {
  if (userId && task.creatorId === userId) return 'creator';
  if (userId && task.assigneeId === userId) return 'assignee';
  return 'observer';
}

/** The most recent still-pending submission (creator review target), or null. */
export function latestPendingSubmission(submissions: TaskSubmission[]): TaskSubmission | null {
  const pending = submissions.filter((s) => s.status === 'Submitted');
  return pending.length > 0 ? pending[pending.length - 1] : null;
}

/** One node in the derived status timeline. */
export interface TimelineEvent {
  id: string;
  title: string;
  detail: string | null;
  state: 'done' | 'current' | 'rejected' | 'todo';
}

/** Short human date-time (e.g. "Jul 13, 9:20 AM"), or null for bad input. */
export function formatWhen(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Builds a status timeline purely from real task data: the created event, each
 * evidence submission and its review outcome, and a trailing "current" marker.
 * No fabricated steps — everything derives from `task.createdAt` and the
 * submission history.
 */
export function buildTimeline(detail: TaskDetail): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { id: 'created', title: 'Challenge created', detail: formatWhen(detail.createdAt), state: 'done' },
  ];

  if (detail.status !== 'Open' && detail.status !== 'Invited') {
    events.push({ id: 'accepted', title: 'Invite accepted', detail: null, state: 'done' });
  }

  detail.submissions.forEach((sub, index) => {
    events.push({
      id: `sub-${sub.id}`,
      title: `Evidence submitted${detail.submissions.length > 1 ? ` (attempt ${index + 1})` : ''}`,
      detail: formatWhen(sub.submittedAt),
      state: 'done',
    });
    if (sub.status === 'Approved') {
      events.push({ id: `rev-${sub.id}`, title: 'Approved', detail: formatWhen(sub.reviewedAt), state: 'done' });
    } else if (sub.status === 'Rejected') {
      events.push({
        id: `rev-${sub.id}`,
        title: 'Rejected',
        detail: sub.rejectionReason ?? formatWhen(sub.reviewedAt),
        state: 'rejected',
      });
    }
  });

  return events;
}

/** Human-readable summary of how a task is verified. */
export function verificationSummary(task: Task): string {
  switch (task.verificationMethod) {
    case 'CREATOR_APPROVAL':
      return 'The creator reviews submitted evidence.';
    case 'SELF':
      return 'Self-verified on completion.';
    case 'NONE':
      return 'No evidence required.';
    default:
      return 'Verification handled automatically.';
  }
}
