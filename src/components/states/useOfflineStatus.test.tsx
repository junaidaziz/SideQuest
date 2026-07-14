import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStatus } from './useOfflineStatus';

type Listener = (state: { isConnected: boolean | null }) => void;

// Prefixed with `mock` so jest.mock's factory may reference them (Jest hoists
// the mock above the imports and only allows out-of-scope vars named `mock*`).
let mockListener: Listener | null = null;
const mockUnsubscribe = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn((cb: Listener) => {
      mockListener = cb;
      return mockUnsubscribe;
    }),
  },
}));

function Probe() {
  const offline = useOfflineStatus();
  return <Text>{offline ? 'OFFLINE' : 'ONLINE'}</Text>;
}

describe('useOfflineStatus', () => {
  beforeEach(() => {
    mockListener = null;
    mockUnsubscribe.mockClear();
    (NetInfo.addEventListener as jest.Mock).mockClear();
  });

  it('starts online and subscribes to NetInfo', async () => {
    const { getByText } = await render(<Probe />);
    expect(getByText('ONLINE')).toBeTruthy();
    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('flips to offline when the device disconnects', async () => {
    const { getByText } = await render(<Probe />);
    await act(async () => {
      mockListener?.({ isConnected: false });
    });
    expect(getByText('OFFLINE')).toBeTruthy();
  });

  it('treats a connected state as online', async () => {
    const { getByText } = await render(<Probe />);
    await act(async () => {
      mockListener?.({ isConnected: false });
    });
    await act(async () => {
      mockListener?.({ isConnected: true });
    });
    expect(getByText('ONLINE')).toBeTruthy();
  });

  it('treats an unknown (null) connection as online', async () => {
    const { getByText } = await render(<Probe />);
    await act(async () => {
      mockListener?.({ isConnected: null });
    });
    expect(getByText('ONLINE')).toBeTruthy();
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = await render(<Probe />);
    await act(async () => {
      unmount();
    });
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
