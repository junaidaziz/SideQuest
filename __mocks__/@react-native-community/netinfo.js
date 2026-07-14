/**
 * Manual mock for @react-native-community/netinfo. The native module can't load
 * under Jest; modules that import NetInfo directly (the offline write queue via
 * `NetInfo.fetch`, and `useOfflineStatus` via `addEventListener`) would
 * otherwise throw at import time. Defaults to "connected". Tests that drive
 * connectivity state override this with a local `jest.mock(...)`.
 */
module.exports = {
  __esModule: true,
  default: {
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
    addEventListener: jest.fn(() => jest.fn()),
    configure: jest.fn(),
  },
};
