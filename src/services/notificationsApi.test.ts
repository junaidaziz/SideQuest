import { apiRequest } from './apiClient';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notificationsApi';
import type { AppNotification, MarkReadResult, PaginatedNotifications, UnreadCount } from '../types/api';

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
});
