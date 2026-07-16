import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {
  registerForPushNotifications,
  unregisterCurrentDevice,
  subscribeToNotificationTaps,
} from './pushNotifications';
import { registerPushToken, deregisterPushToken } from './notificationsApi';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
}));

jest.mock('./notificationsApi');

const mockGetPermissionsAsync = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissionsAsync = Notifications.requestPermissionsAsync as jest.Mock;
const mockGetExpoPushTokenAsync = Notifications.getExpoPushTokenAsync as jest.Mock;
const mockSetNotificationChannelAsync = Notifications.setNotificationChannelAsync as jest.Mock;
const mockAddNotificationResponseReceivedListener =
  Notifications.addNotificationResponseReceivedListener as jest.Mock;
const mockRegisterPushToken = registerPushToken as jest.Mock;
const mockDeregisterPushToken = deregisterPushToken as jest.Mock;

describe('pushNotifications', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({ type: 'expo', data: 'ExponentPushToken[abc123]' });
    mockRegisterPushToken.mockResolvedValue({
      id: 'tok-1',
      token: 'ExponentPushToken[abc123]',
      platform: 'ios',
      deviceId: null,
      createdAt: '2026-07-16T00:00:00.000Z',
      updatedAt: '2026-07-16T00:00:00.000Z',
    });
    mockDeregisterPushToken.mockResolvedValue({ success: true, removed: 1 });
  });

  afterEach(async () => {
    Platform.OS = originalOS;
    // The module caches the last-registered token at module scope (by
    // design — see pushNotifications.ts), which would otherwise leak across
    // tests in this file. Reset it via the same best-effort path logout uses.
    await unregisterCurrentDevice();
  });

  describe('registerForPushNotifications', () => {
    it('registers the Expo push token when permission is already granted', async () => {
      const token = await registerForPushNotifications();
      expect(token).toBe('ExponentPushToken[abc123]');
      expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
      expect(mockRegisterPushToken).toHaveBeenCalledWith({
        token: 'ExponentPushToken[abc123]',
        platform: 'ios',
      });
    });

    it('requests permission when not already granted, and registers on approval', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      const token = await registerForPushNotifications();
      expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
      expect(token).toBe('ExponentPushToken[abc123]');
    });

    it('returns null and skips registration when permission is denied', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });
      const token = await registerForPushNotifications();
      expect(token).toBeNull();
      expect(mockRegisterPushToken).not.toHaveBeenCalled();
    });

    it('returns null when no EAS projectId is available', async () => {
      (Constants as { expoConfig?: unknown }).expoConfig = { extra: { eas: {} } };
      const token = await registerForPushNotifications();
      expect(token).toBeNull();
      expect(mockRegisterPushToken).not.toHaveBeenCalled();
      (Constants as { expoConfig?: unknown }).expoConfig = { extra: { eas: { projectId: 'test-project-id' } } };
    });

    it('returns null (not a thrown error) when the backend call fails', async () => {
      mockRegisterPushToken.mockRejectedValue(new Error('network'));
      const token = await registerForPushNotifications();
      expect(token).toBeNull();
    });

    it('sets up an Android notification channel on Android, not on iOS', async () => {
      await registerForPushNotifications();
      expect(mockSetNotificationChannelAsync).not.toHaveBeenCalled();

      Platform.OS = 'android';
      await registerForPushNotifications();
      expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith(
        'default',
        expect.objectContaining({ name: 'Default' }),
      );
      expect(mockRegisterPushToken).toHaveBeenLastCalledWith({
        token: 'ExponentPushToken[abc123]',
        platform: 'android',
      });
    });
  });

  describe('unregisterCurrentDevice', () => {
    it('no-ops when no token has been registered yet', async () => {
      await unregisterCurrentDevice();
      expect(mockDeregisterPushToken).not.toHaveBeenCalled();
    });

    it('deregisters the most recently registered token, then clears the cache', async () => {
      await registerForPushNotifications();
      await unregisterCurrentDevice();
      expect(mockDeregisterPushToken).toHaveBeenCalledWith('ExponentPushToken[abc123]');

      await unregisterCurrentDevice();
      expect(mockDeregisterPushToken).toHaveBeenCalledTimes(1);
    });

    it('swallows a deregistration failure (best-effort)', async () => {
      await registerForPushNotifications();
      mockDeregisterPushToken.mockRejectedValue(new Error('network'));
      await expect(unregisterCurrentDevice()).resolves.toBeUndefined();
    });
  });

  describe('subscribeToNotificationTaps', () => {
    it('invokes the callback when a notification response fires, and cleans up on unsubscribe', () => {
      const remove = jest.fn();
      mockAddNotificationResponseReceivedListener.mockImplementation((listener: () => void) => {
        listener();
        return { remove };
      });
      const onOpenNotifications = jest.fn();
      const unsubscribe = subscribeToNotificationTaps(onOpenNotifications);

      expect(onOpenNotifications).toHaveBeenCalledTimes(1);
      unsubscribe();
      expect(remove).toHaveBeenCalledTimes(1);
    });
  });
});
