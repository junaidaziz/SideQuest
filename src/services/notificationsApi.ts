import { apiRequest } from './apiClient';
import type {
  DeregisterPushTokenResult,
  ListNotificationsQuery,
  MarkReadResult,
  PaginatedNotifications,
  PushTokenResult,
  RegisterPushTokenRequest,
  UnreadCount,
} from '../types/api';

/** Serializes defined params into a `?a=b&c=d` suffix (empty when none). */
function buildQuery(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') usp.append(key, value);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

/** Paginated, newest-first list of the caller's in-app notifications. */
export function listNotifications(query: ListNotificationsQuery = {}): Promise<PaginatedNotifications> {
  const qs = buildQuery({
    limit: query.limit?.toString(),
    offset: query.offset?.toString(),
    unreadOnly: query.unreadOnly ? 'true' : undefined,
  });
  return apiRequest<PaginatedNotifications>(`/notifications${qs}`);
}

/** Badge count for the bell icon. */
export function getUnreadCount(): Promise<UnreadCount> {
  return apiRequest<UnreadCount>('/notifications/unread-count');
}

/** Marks a single notification read (idempotent — re-marking an already-read
 * notification is a no-op server-side, not an error). */
export function markNotificationRead(id: string): Promise<void> {
  return apiRequest<void>(`/notifications/${id}/read`, { method: 'PATCH' });
}

/** Marks every unread notification read in one call, e.g. a "Mark all read" CTA. */
export function markAllNotificationsRead(): Promise<MarkReadResult> {
  return apiRequest<MarkReadResult>('/notifications/read-all', { method: 'POST' });
}

/** Registers (or upserts) this device's push token against the current session. */
export function registerPushToken(body: RegisterPushTokenRequest): Promise<PushTokenResult> {
  return apiRequest<PushTokenResult>('/notifications/push-tokens', {
    method: 'POST',
    body,
  });
}

/** Removes a push token, e.g. on logout so a shared device stops receiving
 * the previous session's notifications. */
export function deregisterPushToken(token: string): Promise<DeregisterPushTokenResult> {
  return apiRequest<DeregisterPushTokenResult>(
    `/notifications/push-tokens/${encodeURIComponent(token)}`,
    { method: 'DELETE' },
  );
}
