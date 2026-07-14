import { AppState } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { offlineQueue } from '../services/offlineQueue';
import { useOfflineStatus } from '../components/states/useOfflineStatus';
import { useOfflineQueue } from './useOfflineQueue';

jest.mock('../services/offlineQueue', () => ({
  offlineQueue: {
    snapshot: jest.fn(() => ({ items: [], pending: 0, failed: 0, isSyncing: false })),
    subscribe: jest.fn(() => jest.fn()),
    load: jest.fn(() => Promise.resolve()),
    drain: jest.fn(() => Promise.resolve()),
    retryAll: jest.fn(() => Promise.resolve()),
  },
}));
jest.mock('../components/states/useOfflineStatus', () => ({ useOfflineStatus: jest.fn() }));

const mockOffline = useOfflineStatus as jest.Mock;
const mockDrain = offlineQueue.drain as jest.Mock;
const mockSubscribe = offlineQueue.subscribe as jest.Mock;

describe('useOfflineQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOffline.mockReturnValue(false);
    mockSubscribe.mockReturnValue(jest.fn());
  });

  it('loads and subscribes to the queue on mount', async () => {
    await renderHook(() => useOfflineQueue());
    expect(offlineQueue.load).toHaveBeenCalled();
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('drains on mount when already online', async () => {
    await renderHook(() => useOfflineQueue());
    expect(mockDrain).toHaveBeenCalled();
  });

  it('does not drain on mount while offline, then drains when connection returns', async () => {
    mockOffline.mockReturnValue(true);
    const { rerender } = await renderHook(() => useOfflineQueue());
    expect(mockDrain).not.toHaveBeenCalled();

    mockOffline.mockReturnValue(false);
    await act(async () => {
      await rerender(undefined);
    });
    expect(mockDrain).toHaveBeenCalled();
  });

  it('drains when the app returns to the foreground', async () => {
    const addSpy = jest.spyOn(AppState, 'addEventListener');
    await renderHook(() => useOfflineQueue());
    mockDrain.mockClear();

    const handler = addSpy.mock.calls[0][1] as (s: string) => void;
    await act(async () => handler('active'));
    expect(mockDrain).toHaveBeenCalledTimes(1);

    // A non-active transition must not drain.
    await act(async () => handler('background'));
    expect(mockDrain).toHaveBeenCalledTimes(1);
    addSpy.mockRestore();
  });

  it('unsubscribes and removes the AppState listener on unmount', async () => {
    const unsub = jest.fn();
    mockSubscribe.mockReturnValue(unsub);
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove } as never);

    const { unmount } = await renderHook(() => useOfflineQueue());
    await unmount();
    expect(unsub).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('exposes retryAll wired to the queue', async () => {
    const { result } = await renderHook(() => useOfflineQueue());
    await act(async () => result.current.retryAll());
    expect(offlineQueue.retryAll).toHaveBeenCalledTimes(1);
  });

  it('surfaces the offline flag', async () => {
    mockOffline.mockReturnValue(true);
    const { result } = await renderHook(() => useOfflineQueue());
    expect(result.current.offline).toBe(true);
  });
});
