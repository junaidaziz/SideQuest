import React from 'react';
import { cleanup, render, screen } from '@testing-library/react-native';
import { useOfflineStatus } from '../states/useOfflineStatus';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { OfflineChrome } from './OfflineChrome';

jest.mock('../states/useOfflineStatus', () => ({ useOfflineStatus: jest.fn() }));
jest.mock('../../hooks/useOfflineQueue', () => ({ useOfflineQueue: jest.fn() }));

const mockOffline = useOfflineStatus as jest.Mock;
const mockQueue = useOfflineQueue as jest.Mock;

describe('OfflineChrome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueue.mockReturnValue({
      items: [],
      pending: 0,
      failed: 0,
      isSyncing: false,
      offline: false,
      retryAll: jest.fn(),
    });
  });
  afterEach(cleanup);

  it('shows the offline banner while offline', async () => {
    mockOffline.mockReturnValue(true);
    await render(<OfflineChrome />);
    expect(screen.getByTestId('offline-banner')).toBeTruthy();
  });

  it('hides the offline banner while online', async () => {
    mockOffline.mockReturnValue(false);
    await render(<OfflineChrome />);
    expect(screen.queryByTestId('offline-banner')).toBeNull();
  });

  it('surfaces the sync indicator when the queue has pending work', async () => {
    mockOffline.mockReturnValue(false);
    mockQueue.mockReturnValue({
      items: [],
      pending: 2,
      failed: 0,
      isSyncing: false,
      offline: false,
      retryAll: jest.fn(),
    });
    await render(<OfflineChrome />);
    expect(screen.getByTestId('sync-indicator')).toBeTruthy();
    expect(screen.getByText('2 pending')).toBeTruthy();
  });
});
