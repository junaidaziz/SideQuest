import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { SyncIndicator, computeSyncState } from './SyncIndicator';

jest.mock('../../hooks/useOfflineQueue', () => ({ useOfflineQueue: jest.fn() }));

const mockUseQueue = useOfflineQueue as jest.Mock;

function queueState(over: Partial<ReturnType<typeof useOfflineQueue>> = {}) {
  return {
    items: [],
    pending: 0,
    failed: 0,
    isSyncing: false,
    offline: false,
    retryAll: jest.fn(),
    ...over,
  };
}

describe('computeSyncState', () => {
  const base = { offline: false, isSyncing: false, pending: 0, failed: 0, justSynced: false };

  it('prioritises failed with a tap-to-retry action', () => {
    const s = computeSyncState({ ...base, failed: 2, isSyncing: true, pending: 3 });
    expect(s).toEqual({ text: "2 didn't sync · tap to retry", tone: 'error', actionable: true });
  });

  it('shows syncing when draining and nothing failed', () => {
    expect(computeSyncState({ ...base, isSyncing: true, pending: 1 })).toEqual({
      text: 'Syncing…',
      tone: 'info',
      actionable: false,
    });
  });

  it('shows waiting-for-connection when offline with pending items', () => {
    expect(computeSyncState({ ...base, offline: true, pending: 3 })).toMatchObject({
      text: '3 waiting for connection',
      tone: 'muted',
    });
  });

  it('shows a plain pending count when online', () => {
    expect(computeSyncState({ ...base, pending: 2 })).toMatchObject({ text: '2 pending' });
  });

  it('shows the transient all-synced confirmation', () => {
    expect(computeSyncState({ ...base, justSynced: true })).toMatchObject({
      text: 'All synced',
      tone: 'success',
    });
  });

  it('returns null when idle and empty (unobtrusive)', () => {
    expect(computeSyncState(base)).toBeNull();
  });

  it('returns null when merely offline with nothing queued (banner covers it)', () => {
    expect(computeSyncState({ ...base, offline: true })).toBeNull();
  });
});

describe('SyncIndicator', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(cleanup);

  it('renders nothing when the queue is idle and empty', async () => {
    mockUseQueue.mockReturnValue(queueState());
    await render(<SyncIndicator testID="sync" />);
    expect(screen.queryByTestId('sync')).toBeNull();
  });

  it('renders a pending pill', async () => {
    mockUseQueue.mockReturnValue(queueState({ pending: 2 }));
    await render(<SyncIndicator testID="sync" />);
    expect(screen.getByText('2 pending')).toBeTruthy();
  });

  it('renders a syncing pill', async () => {
    mockUseQueue.mockReturnValue(queueState({ isSyncing: true, pending: 1 }));
    await render(<SyncIndicator testID="sync" />);
    expect(screen.getByText('Syncing…')).toBeTruthy();
  });

  it('renders an actionable failed pill and retries on tap', async () => {
    const retryAll = jest.fn();
    mockUseQueue.mockReturnValue(queueState({ failed: 1, retryAll }));
    await render(<SyncIndicator testID="sync" />);
    const node = screen.getByTestId('sync');
    await fireEvent.press(node);
    expect(retryAll).toHaveBeenCalledTimes(1);
  });

  it('shows the transient "All synced" pill after the queue drains to empty', async () => {
    // Regression test for a real order-dependency bug an independent review
    // found: this used to call the initial render() before ever setting a
    // mockReturnValue, silently relying on whatever the *previous* test in
    // this file left configured. Running this test alone (e.g. via
    // --testPathPattern) threw, since useOfflineQueue() returned undefined.
    // Set the state explicitly before every render, including the first.
    mockUseQueue.mockReturnValue(queueState({ pending: 1 }));
    const { rerender } = await render(<SyncIndicator testID="sync" />);
    // Drop to zero -> justSynced flips on.
    mockUseQueue.mockReturnValue(queueState());
    await rerender(<SyncIndicator testID="sync" />);
    expect(screen.getByText('All synced')).toBeTruthy();
  });
});
