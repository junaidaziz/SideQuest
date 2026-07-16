import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../services/notificationsApi');

import NotificationsScreen from './NotificationsScreen';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationsApi';
import type { AppNotification, PaginatedNotifications } from '../../types/api';

const mockListNotifications = listNotifications as jest.MockedFunction<typeof listNotifications>;
const mockGetUnreadCount = getUnreadCount as jest.MockedFunction<typeof getUnreadCount>;
const mockMarkNotificationRead = markNotificationRead as jest.MockedFunction<typeof markNotificationRead>;
const mockMarkAllNotificationsRead = markAllNotificationsRead as jest.MockedFunction<
  typeof markAllNotificationsRead
>;

function makeNotification(overrides: Partial<AppNotification>): AppNotification {
  return {
    id: 'notif-1',
    type: 'task_approved',
    title: 'Quest approved',
    body: 'Your proof for "Hike three trails" was approved.',
    data: null,
    readAt: null,
    createdAt: '2026-07-16T11:00:00.000Z',
    ...overrides,
  };
}

const PAGE: PaginatedNotifications = {
  items: [
    makeNotification({ id: 'n-unread', title: 'Quest approved', readAt: null }),
    makeNotification({ id: 'n-read', title: 'Task accepted', type: 'task_accepted', readAt: '2026-07-16T10:00:00.000Z' }),
  ],
  total: 2,
  limit: 20,
  offset: 0,
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof NotificationsScreen>> = {}) {
  const onBack = jest.fn();
  const onExplore = jest.fn();
  const onOpenNotification = jest.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <NotificationsScreen
        onBack={onBack}
        onExplore={onExplore}
        onOpenNotification={onOpenNotification}
        {...overrides}
      />
    </QueryClientProvider>,
  );
  return { ...utils, onBack, onExplore, onOpenNotification };
}

describe('NotificationsScreen', () => {
  afterEach(cleanup);
  beforeEach(() => {
    jest.clearAllMocks();
    mockListNotifications.mockResolvedValue(PAGE);
    mockGetUnreadCount.mockResolvedValue({ unreadCount: 1 });
    mockMarkNotificationRead.mockResolvedValue(undefined);
    mockMarkAllNotificationsRead.mockResolvedValue({ updated: 1 });
  });

  describe('rendering', () => {
    it('shows the loading skeleton first', async () => {
      mockListNotifications.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading notifications')).toBeTruthy();
    });

    it('renders the list with unread and read rows', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Quest approved\..*Unread/)).toBeTruthy());
      expect(screen.getByLabelText(/Task accepted\./)).toBeTruthy();
      // The read row's label must not claim "Unread".
      expect(screen.getByLabelText(/Task accepted\./).props.accessibilityLabel).not.toMatch(/Unread/);
    });

    it('renders the beautiful empty state with a working CTA when there are no notifications', async () => {
      mockListNotifications.mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 });
      mockGetUnreadCount.mockResolvedValue({ unreadCount: 0 });
      const { onExplore } = await renderScreen();
      await waitFor(() => expect(screen.getByText("You're all caught up!")).toBeTruthy());
      expect(screen.getByText('No new notifications yet.')).toBeTruthy();
      fireEvent.press(screen.getByLabelText('Explore quests'));
      expect(onExplore).toHaveBeenCalledTimes(1);
    });

    it('omits the empty-state CTA when onExplore is not provided', async () => {
      mockListNotifications.mockResolvedValue({ items: [], total: 0, limit: 20, offset: 0 });
      mockGetUnreadCount.mockResolvedValue({ unreadCount: 0 });
      await renderScreen({ onExplore: undefined });
      await waitFor(() => expect(screen.getByText("You're all caught up!")).toBeTruthy());
      expect(screen.queryByLabelText('Explore quests')).toBeNull();
    });

    it('renders the error state and retries', async () => {
      mockListNotifications.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load notifications")).toBeTruthy());
      mockListNotifications.mockResolvedValue(PAGE);
      fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByLabelText(/Quest approved\./)).toBeTruthy());
    });

    it('shows "Mark all read" when there are unread notifications', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Mark all as read')).toBeTruthy());
    });

    it('hides "Mark all read" when there are no unread notifications', async () => {
      mockGetUnreadCount.mockResolvedValue({ unreadCount: 0 });
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Quest approved\./)).toBeTruthy());
      expect(screen.queryByLabelText('Mark all as read')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('marks an unread notification read and opens it on press', async () => {
      const { onOpenNotification } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Quest approved\./)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/Quest approved\./));
      await waitFor(() =>
        expect(mockMarkNotificationRead).toHaveBeenCalledWith('n-unread', expect.anything()),
      );
      expect(onOpenNotification).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'n-unread' }),
      );
    });

    it('opens an already-read notification without re-marking it read', async () => {
      const { onOpenNotification } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Task accepted\./)).toBeTruthy());
      fireEvent.press(screen.getByLabelText(/Task accepted\./));
      await waitFor(() =>
        expect(onOpenNotification).toHaveBeenCalledWith(expect.objectContaining({ id: 'n-read' })),
      );
      expect(mockMarkNotificationRead).not.toHaveBeenCalled();
    });

    it('marks all notifications read from the header', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Mark all as read')).toBeTruthy());
      fireEvent.press(screen.getByLabelText('Mark all as read'));
      await waitFor(() => expect(mockMarkAllNotificationsRead).toHaveBeenCalledTimes(1));
    });

    it('invokes onBack from the header', async () => {
      const { onBack } = await renderScreen();
      fireEvent.press(screen.getByLabelText('Back'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('gives every button a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Quest approved\./)).toBeTruthy());
      screen.getAllByRole('button').forEach((b) => {
        expect(b.props.accessibilityLabel).toBeTruthy();
      });
    });
  });
});
