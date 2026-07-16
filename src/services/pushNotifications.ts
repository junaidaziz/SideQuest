import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerPushToken, deregisterPushToken } from './notificationsApi';
import type { PushPlatform } from '../types/api';

/** Foreground presentation: banner + list entry + sound + badge, matching
 * the system default for a backgrounded app. Registered at module load so
 * it's active before any screen mounts. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const ANDROID_CHANNEL_ID = 'default';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Cached in-memory so logout can deregister the same token it registered,
 * without re-prompting for permission or re-hitting Expo's token endpoint. */
let cachedToken: string | null = null;

/**
 * Requests notification permission (if not already decided) and registers
 * this device's Expo push token against the current session via the
 * existing `POST /notifications/push-tokens` endpoint (an upsert, so this
 * is safe to call on every app-ready transition — hydrate, login, signup,
 * Google sign-in).
 *
 * Returns `null` on anything short of success (permission denied, no EAS
 * projectId available e.g. running in Expo Go, or a network failure) —
 * push is an enhancement, never a requirement to use the app, so callers
 * should not surface this as a user-facing error.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (typeof projectId !== 'string' || !projectId) return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const platform: PushPlatform = Platform.OS === 'ios' ? 'ios' : 'android';
    await registerPushToken({ token, platform });
    cachedToken = token;
    return token;
  } catch {
    return null;
  }
}

/** Deregisters the token this device last registered, e.g. on logout so a
 * shared device stops receiving the previous session's notifications.
 * Best-effort — a failure here must not block logout, mirroring the
 * server-revoke call in `authStore.logout()`. */
export async function unregisterCurrentDevice(): Promise<void> {
  const token = cachedToken;
  if (!token) return;
  cachedToken = null;
  try {
    await deregisterPushToken(token);
  } catch {
    // Best-effort — see doc comment.
  }
}

/** Wires a tap on a delivered push notification (app backgrounded or
 * killed) to `onOpenNotifications` — routes into the existing in-app
 * Notifications list rather than attempting per-type deep-linking, since
 * NotificationsScreen's own row-level `data.screen` routing is intentionally
 * left navigation-agnostic (see NotificationsScreen.tsx) and not yet wired
 * to concrete routes. Returns a cleanup function for a `useEffect`. */
export function subscribeToNotificationTaps(onOpenNotifications: () => void): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(() => {
    onOpenNotifications();
  });
  return () => subscription.remove();
}
