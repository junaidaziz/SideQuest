import type { NotificationType } from '../../types/api';

/** Icon glyph per notification type, matching the event it represents. */
const TYPE_ICONS: Record<NotificationType, string> = {
  task_assigned: '\u{1F4CB}',
  task_accepted: '\u{2705}',
  task_declined: '\u{274C}',
  task_submitted: '\u{1F4F8}',
  task_approved: '\u{1F389}',
  task_rejected: '\u{26A0}\u{FE0F}',
  referral_registered: '\u{1F91D}',
  referral_reward_earned: '\u{1F381}',
  account_event: '\u{1F514}',
};

/** Icon glyph for a notification's type, falling back to a generic bell for
 * any type this client doesn't recognize yet (forward-compatible with new
 * backend-added types). */
export function iconForType(type: NotificationType): string {
  return TYPE_ICONS[type] ?? '\u{1F514}';
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/** Compact relative timestamp ("Just now" / "5m ago" / "3h ago" / "2d ago"),
 * falling back to a short date past a week so old notifications don't show
 * an ever-growing day count. */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();

  if (diffMs < MINUTE_MS) return 'Just now';
  if (diffMs < HOUR_MS) return `${Math.floor(diffMs / MINUTE_MS)}m ago`;
  if (diffMs < DAY_MS) return `${Math.floor(diffMs / HOUR_MS)}h ago`;
  if (diffMs < WEEK_MS) return `${Math.floor(diffMs / DAY_MS)}d ago`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
