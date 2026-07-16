import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import SettingsRoute from '../../app/settings/index';
import EditProfileRoute from '../../app/settings/edit-profile';
import AccountSecurityRoute from '../../app/settings/account-security';
import AppearanceRoute from '../../app/settings/appearance';
import NotificationPreferencesRoute from '../../app/settings/notifications';

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
  jest.fn(({ onBack }: { onBack: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>;
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

  it('calls the real PATCH /auth/password endpoint', async () => {
    const { getByLabelText } = await render(<AccountSecurityRoute />);
    await fireEvent.press(getByLabelText('onChangePassword'));
    expect(mockChangePassword).toHaveBeenCalledWith({ currentPassword: 'old-pw', newPassword: 'new-pw' });
  });

  it('calls the real DELETE /auth/me endpoint with the password as currentPassword', async () => {
    const { getByLabelText } = await render(<AccountSecurityRoute />);
    await fireEvent.press(getByLabelText('onDeleteAccount'));
    expect(mockDeleteAccount).toHaveBeenCalledWith({ currentPassword: 'current-pw' });
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
});
