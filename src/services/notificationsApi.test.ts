import { apiRequest } from './apiClient';
import {
  deregisterPushToken,
  getUnreadCount,
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerPushToken,
  updateNotificationPreferences,
} from './notificationsApi';
import type {
  AppNotification,
  DeregisterPushTokenResult,
  MarkReadResult,
  PaginatedNotifications,
  PushTokenResult,
  UnreadCount,
} from '../types/api';

jest.mock('./apiClient');

const mockApiRequest = apiRequest as jest.Mock;

const NOTIFICATION: AppNotification = {
  id: 'notif-1',
  type: 'task_accepted',
  title: 'Task accepted',
  body: 'Alex accepted your task "Buy groceries".',
  data: { screen: 'task-detail', taskId: 'task-9' },
  readAt: null,
  createdAt: '2026-07-16T10:00:00.000Z',
};

const PAGE: PaginatedNotifications = {
  items: [NOTIFICATION],
  total: 1,
  limit: 20,
  offset: 0,
};

describe('notificationsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listNotifications', () => {
    it('GETs /notifications with no query when called empty', async () => {
      mockApiRequest.mockResolvedValue(PAGE);
      const result = await listNotifications();
      expect(mockApiRequest).toHaveBeenCalledWith('/notifications');
      expect(result).toBe(PAGE);
    });

    it('appends limit, offset, and unreadOnly params', async () => {
      mockApiRequest.mockResolvedValue(PAGE);
      await listNotifications({ limit: 10, offset: 20, unreadOnly: true });
      expect(mockApiRequest).toHaveBeenCalledWith('/notifications?limit=10&offset=20&unreadOnly=true');
    });

    it('includes a zero offset (0 is a valid value, not omitted)', async () => {
      mockApiRequest.mockResolvedValue(PAGE);
      await listNotifications({ offset: 0 });
      expect(mockApiRequest).toHaveBeenCalledWith('/notifications?offset=0');
    });

    it('omits unreadOnly when false', async () => {
      mockApiRequest.mockResolvedValue(PAGE);
      await listNotifications({ unreadOnly: false });
      expect(mockApiRequest).toHaveBeenCalledWith('/notifications');
    });
  });

  describe('getUnreadCount', () => {
    it('GETs /notifications/unread-count', async () => {
      const count: UnreadCount = { unreadCount: 3 };
      mockApiRequest.mockResolvedValue(count);
      const result = await getUnreadCount();
      expect(mockApiRequest).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toBe(count);
    });
  });

  describe('notification preferences', () => {
    const preferences = {
      pushEnabled: true,
      taskEventsEnabled: true,
      referralEventsEnabled: false,
      accountEventsEnabled: true,
    };

    it('GETs the persisted preferences', async () => {
      mockApiRequest.mockResolvedValue(preferences);
      expect(await getNotificationPreferences()).toBe(preferences);
      expect(mockApiRequest).toHaveBeenCalledWith('/notifications/preferences');
    });

    it('PATCHes a partial preference update', async () => {
      mockApiRequest.mockResolvedValue({ ...preferences, referralEventsEnabled: true });
      await updateNotificationPreferences({ referralEventsEnabled: true });
      expect(mockApiRequest).toHaveBeenCalledWith('/notifications/preferences', {
        method: 'PATCH',
        body: { referralEventsEnabled: true },
      });
    });
  });

  describe('markNotificationRead', () => {
    it('PATCHes /notifications/:id/read', async () => {
      mockApiRequest.mockResolvedValue(undefined);
      await markNotificationRead('notif-1');
      expect(mockApiRequest).toHaveBeenCalledWith('/notifications/notif-1/read', { method: 'PATCH' });
    });
  });

  describe('markAllNotificationsRead', () => {
    it('POSTs /notifications/read-all', async () => {
      const result: MarkReadResult = { updated: 5 };
      mockApiRequest.mockResolvedValue(result);
      const outcome = await markAllNotificationsRead();
      expect(mockApiRequest).toHaveBeenCalledWith('/notifications/read-all', { method: 'POST' });
      expect(outcome).toBe(result);
    });
  });

  describe('registerPushToken', () => {
    it('POSTs /notifications/push-tokens with the token body', async () => {
      const result: PushTokenResult = {
        id: 'tok-1',
        token: 'ExponentPushToken[abc123]',
        platform: 'ios',
        deviceId: null,
        createdAt: '2026-07-16T10:00:00.000Z',
        updatedAt: '2026-07-16T10:00:00.000Z',
      };
      mockApiRequest.mockResolvedValue(result);
      const outcome = await registerPushToken({ token: 'ExponentPushToken[abc123]', platform: 'ios' });
      expect(mockApiRequest).toHaveBeenCalledWith('/notifications/push-tokens', {
        method: 'POST',
        body: { token: 'ExponentPushToken[abc123]', platform: 'ios' },
      });
      expect(outcome).toBe(result);
    });
  });

  describe('deregisterPushToken', () => {
    it('DELETEs /notifications/push-tokens/:token, URL-encoded', async () => {
      const result: DeregisterPushTokenResult = { success: true, removed: 1 };
      mockApiRequest.mockResolvedValue(result);
      const outcome = await deregisterPushToken('ExponentPushToken[abc/123]');
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/notifications/push-tokens/ExponentPushToken%5Babc%2F123%5D',
        { method: 'DELETE' },
      );
      expect(outcome).toBe(result);
    });
  });
});
