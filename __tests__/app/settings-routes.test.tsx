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
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (selector: (s: { logout: () => Promise<void> }) => unknown) => selector({ logout: mockLogout }),
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
  jest.fn(({ onBack, onDeleted }: { onBack: () => void; onDeleted: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="onDeleted" onPress={onDeleted}><Text>d</Text></Pressable>
      </>
    );
  }),
);
jest.mock('../../src/screens/AppearanceAccessibilityScreen', () =>
  jest.fn(({ onBack }: { onBack: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>;
  }),
);
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
  beforeEach(() => jest.clearAllMocks());
  it('goes back and replaces to Today after deletion', async () => {
    const { getByLabelText } = await render(<AccountSecurityRoute />);
    await fireEvent.press(getByLabelText('onBack'));
    await fireEvent.press(getByLabelText('onDeleted'));
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/today');
  });
});

describe('Appearance & Notification routes', () => {
  beforeEach(() => jest.clearAllMocks());
  it('appearance goes back', async () => {
    const { getByLabelText } = await render(<AppearanceRoute />);
    await fireEvent.press(getByLabelText('onBack'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
  it('notifications goes back', async () => {
    const { getByLabelText } = await render(<NotificationPreferencesRoute />);
    await fireEvent.press(getByLabelText('onBack'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
