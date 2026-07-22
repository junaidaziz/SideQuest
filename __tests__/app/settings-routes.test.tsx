import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import SettingsRoute from '../../app/settings/index';
import EditProfileRoute from '../../app/settings/edit-profile';
import AccountSecurityRoute from '../../app/settings/account-security';
import AppearanceRoute from '../../app/settings/appearance';
import NotificationPreferencesRoute from '../../app/settings/notifications';
import { ApiError } from '../../src/services/apiClient';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() } }));

const mockLogout = jest.fn().mockResolvedValue(undefined);
// AccountSecurityRoute redirects a guest before AccountSecurityScreen ever
// mounts (same primary-checkpoint pattern as app/payment-methods.tsx) —
// default to a signed-in user so the existing render/interaction tests
// exercise the real screen; a dedicated test flips this to a guest.
let mockIsGuest = false;
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (
    selector: (s: { logout: () => Promise<void>; user: { isGuest: boolean } | null }) => unknown,
  ) => selector({ logout: mockLogout, user: { isGuest: mockIsGuest } }),
}));

const mockChangePassword = jest.fn().mockResolvedValue({ success: true });
const mockDeleteAccount = jest.fn().mockResolvedValue({ success: true });
jest.mock('../../src/services/authApi', () => ({
  changePassword: (...args: unknown[]) => mockChangePassword(...args),
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}));

const mockUpdateNotificationPreferences = jest.fn();
const mockSetQueryData = jest.fn();
const mockInvalidateQueries = jest.fn();
let capturedMutationOptions: Record<string, unknown> | undefined;
jest.mock('../../src/services/notificationsApi', () => ({
  getNotificationPreferences: jest.fn(),
  updateNotificationPreferences: (...args: unknown[]) => mockUpdateNotificationPreferences(...args),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: { pushEnabled: true, taskEventsEnabled: true, referralEventsEnabled: true, accountEventsEnabled: true },
    isPending: false,
    isError: false,
  }),
  useMutation: (options: Record<string, unknown>) => {
    capturedMutationOptions = options;
    return { mutate: mockUpdateNotificationPreferences };
  },
  useQueryClient: () => ({
    getQueryData: () => ({ pushEnabled: true, taskEventsEnabled: true, referralEventsEnabled: true, accountEventsEnabled: true }),
    setQueryData: mockSetQueryData,
    invalidateQueries: mockInvalidateQueries,
  }),
}));

let mockThemePreference: 'system' | 'light' | 'dark' | null = 'system';
const mockSetPreference = jest.fn().mockResolvedValue(undefined);
jest.mock('../../src/store/themeStore', () => ({
  useThemeStore: (selector: (s: { preference: unknown; setPreference: unknown }) => unknown) =>
    selector({ preference: mockThemePreference, setPreference: mockSetPreference }),
}));

jest.mock('../../src/screens/SettingsScreen', () =>
  jest.fn((props: Record<string, () => void>) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    const keys = ['onBack', 'onAccountSecurity', 'onNotifications', 'onAppearance', 'onAccessibility', 'onLogout'];
    return (
      <>
        {keys.map((k) => (
          <Pressable key={k} accessibilityRole="button" accessibilityLabel={k} onPress={props[k]}>
            <Text>{k}</Text>
          </Pressable>
        ))}
      </>
    );
  }),
);
jest.mock('../../src/screens/EditProfileScreen', () =>
  jest.fn(({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="onSaved" onPress={onSaved}><Text>s</Text></Pressable>
      </>
    );
  }),
);
jest.mock('../../src/screens/AccountSecurityScreen', () =>
  jest.fn(
    ({
      onBack,
      onChangePassword,
      onDeleteAccount,
      onDeleted,
    }: {
      onBack: () => void;
      onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
      onDeleteAccount: (password: string) => Promise<void>;
      onDeleted: () => void;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      return (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="onChangePassword"
            onPress={() => onChangePassword('old-pw', 'new-pw')}
          >
            <Text>p</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="onDeleteAccount"
            onPress={() => onDeleteAccount('current-pw')}
          >
            <Text>x</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="onDeleted" onPress={onDeleted}><Text>d</Text></Pressable>
        </>
      );
    },
  ),
);
jest.mock('../../src/screens/AppearanceAccessibilityScreen', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual('../../src/screens/AppearanceAccessibilityScreen');
  return {
    __esModule: true,
    DEFAULT_APPEARANCE_SETTINGS: actual.DEFAULT_APPEARANCE_SETTINGS,
    default: jest.fn(
      ({
        onBack,
        initialSettings,
        onThemeChange,
      }: {
        onBack: () => void;
        initialSettings: { theme: string };
        onThemeChange: (theme: string) => void;
      }) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Pressable, Text } = require('react-native');
        return (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>
            <Text accessibilityLabel="currentTheme">{initialSettings.theme}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="chooseDark"
              onPress={() => onThemeChange('dark')}
            >
              <Text>dark</Text>
            </Pressable>
          </>
        );
      },
    ),
  };
});
jest.mock('../../src/screens/NotificationPreferencesScreen', () =>
  jest.fn(({ onBack, onChange }: { onBack: () => void; onChange: (value: Record<string, boolean>) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return <>
      <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="changePreferences"
        onPress={() => onChange({
          pushEnabled: false,
          taskEventsEnabled: true,
          referralEventsEnabled: true,
          accountEventsEnabled: true,
        })}
      ><Text>c</Text></Pressable>
    </>;
  }),
);

describe('SettingsRoute', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['onAccountSecurity', '/settings/account-security'],
    ['onNotifications', '/settings/notifications'],
    ['onAppearance', '/settings/appearance'],
    ['onAccessibility', '/settings/appearance'],
  ])('routes %s to %s', async (label, target) => {
    const { getByLabelText } = await render(<SettingsRoute />);
    await fireEvent.press(getByLabelText(label));
    expect(router.push).toHaveBeenCalledWith(target);
  });

  it('goes back from the back control', async () => {
    const { getByLabelText } = await render(<SettingsRoute />);
    await fireEvent.press(getByLabelText('onBack'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('logs out then replaces to the Today tab', async () => {
    const { getByLabelText } = await render(<SettingsRoute />);
    await fireEvent.press(getByLabelText('onLogout'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/today');
  });
});

describe('EditProfileRoute', () => {
  beforeEach(() => jest.clearAllMocks());
  it('goes back on back and on saved', async () => {
    const { getByLabelText } = await render(<EditProfileRoute />);
    await fireEvent.press(getByLabelText('onBack'));
    await fireEvent.press(getByLabelText('onSaved'));
    expect(router.back).toHaveBeenCalledTimes(2);
  });
});

describe('AccountSecurityRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsGuest = false;
    mockChangePassword.mockResolvedValue({ success: true });
    mockDeleteAccount.mockResolvedValue({ success: true });
  });

  it('redirects a guest before the screen ever mounts', async () => {
    mockIsGuest = true;
    const { queryByLabelText } = await render(<AccountSecurityRoute />);
    expect(router.replace).toHaveBeenCalledWith('/today');
    expect(queryByLabelText('onBack')).toBeNull();
  });

  it('goes back and, after deletion, logs out locally then replaces to Today', async () => {
    const { getByLabelText } = await render(<AccountSecurityRoute />);
    await fireEvent.press(getByLabelText('onBack'));
    await fireEvent.press(getByLabelText('onDeleted'));
    expect(router.back).toHaveBeenCalledTimes(1);
    // The account is already soft-deleted server-side by this point (the
    // screen only calls onDeleted after onDeleteAccount resolves) — this
    // route still clears the device's own local session the same way
    // logout() always does, before landing on Today.
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/today');
  });

  it('changes the password, clears the now-revoked local session, and returns to Today', async () => {
    const { getByLabelText } = await render(<AccountSecurityRoute />);
    await fireEvent.press(getByLabelText('onChangePassword'));
    expect(mockChangePassword).toHaveBeenCalledWith({ currentPassword: 'old-pw', newPassword: 'new-pw' });
    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
    expect(router.replace).toHaveBeenCalledWith('/today');
  });

  it('calls the real DELETE /auth/me endpoint with the password as currentPassword', async () => {
    const { getByLabelText } = await render(<AccountSecurityRoute />);
    await fireEvent.press(getByLabelText('onDeleteAccount'));
    expect(mockDeleteAccount).toHaveBeenCalledWith({ currentPassword: 'current-pw' });
  });

  it('uses explicit confirmation only when the backend identifies a passwordless account', async () => {
    mockDeleteAccount
      .mockRejectedValueOnce(new ApiError(400, {
        statusCode: 400,
        message: 'This account has no password; set confirm=true to delete it.',
        timestamp: '2026-01-01T00:00:00.000Z',
        path: '/auth/me',
      }))
      .mockResolvedValueOnce({ success: true });
    const { getByLabelText } = await render(<AccountSecurityRoute />);

    await fireEvent.press(getByLabelText('onDeleteAccount'));

    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(2));
    expect(mockDeleteAccount).toHaveBeenNthCalledWith(1, { currentPassword: 'current-pw' });
    expect(mockDeleteAccount).toHaveBeenNthCalledWith(2, { confirm: true });
  });
});

describe('Appearance & Notification routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockThemePreference = 'system';
  });

  it('appearance goes back', async () => {
    const { getByLabelText } = await render(<AppearanceRoute />);
    await fireEvent.press(getByLabelText('onBack'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('passes the persisted theme preference through as the initial selection', async () => {
    mockThemePreference = 'dark';
    const { getByLabelText } = await render(<AppearanceRoute />);
    expect(getByLabelText('currentTheme').props.children).toBe('dark');
  });

  it('falls back to system while the preference is still null (pre-hydrate)', async () => {
    mockThemePreference = null;
    const { getByLabelText } = await render(<AppearanceRoute />);
    expect(getByLabelText('currentTheme').props.children).toBe('system');
  });

  it('persists a theme change via the real setPreference action', async () => {
    const { getByLabelText } = await render(<AppearanceRoute />);
    await fireEvent.press(getByLabelText('chooseDark'));
    expect(mockSetPreference).toHaveBeenCalledWith('dark');
  });

  it('notifications goes back', async () => {
    const { getByLabelText } = await render(<NotificationPreferencesRoute />);
    await fireEvent.press(getByLabelText('onBack'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('serializes preference writes and ignores stale mutation responses', async () => {
    const { getByLabelText } = await render(<NotificationPreferencesRoute />);
    expect(capturedMutationOptions?.scope).toEqual({ id: 'notification-preferences' });
    const onSuccess = capturedMutationOptions?.onSuccess as
      | ((saved: Record<string, boolean>, variables: { revision: number }) => void)
      | undefined;
    expect(onSuccess).toBeDefined();

    await fireEvent.press(getByLabelText('changePreferences'));
    await fireEvent.press(getByLabelText('changePreferences'));
    mockSetQueryData.mockClear();
    onSuccess?.({ pushEnabled: true }, { revision: 1 });
    expect(mockSetQueryData).not.toHaveBeenCalled();
    onSuccess?.({ pushEnabled: false }, { revision: 2 });
    expect(mockSetQueryData).toHaveBeenCalledWith(
      ['notification-preferences'],
      { pushEnabled: false },
    );
  });
});
