import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import NotificationPreferencesScreen, {
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './NotificationPreferencesScreen';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(() => Promise.resolve()) }));

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof NotificationPreferencesScreen>> = {},
) {
  const props = { onBack: jest.fn(), onChange: jest.fn(), ...overrides };
  await render(<NotificationPreferencesScreen {...props} />);
  return props;
}

describe('NotificationPreferencesScreen', () => {
  describe('rendering', () => {
    it('renders only the backend-supported preference groups', async () => {
      await renderScreen();
      expect(screen.getByText('PUSH NOTIFICATIONS')).toBeTruthy();
      expect(screen.getByText('WHAT YOU HEAR ABOUT')).toBeTruthy();
      expect(screen.queryByText('QUIET HOURS')).toBeNull();
    });

    it('reflects the default preference switch states', async () => {
      await renderScreen();
      expect(
        screen.getByLabelText('Allow push notifications').props.accessibilityState,
      ).toMatchObject({ checked: true });
      expect(
        screen.getByLabelText('Account activity notifications').props.accessibilityState,
      ).toMatchObject({ checked: true });
    });

    it('accepts injected initial preferences', async () => {
      await renderScreen({
        initialPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES, taskEventsEnabled: false },
      });
      expect(
        screen.getByLabelText('Task and challenge notifications').props.accessibilityState,
      ).toMatchObject({ checked: false });
    });
  });

  describe('interactions', () => {
    it('toggles a category and reports the change', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Referral notifications'));
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ referralEventsEnabled: false }),
      );
      expect(
        screen.getByLabelText('Referral notifications').props.accessibilityState,
      ).toMatchObject({ checked: false });
    });

    it('disables and blanks category switches when push is turned off', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Allow push notifications'));
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ pushEnabled: false }),
      );
      const verification = screen.getByLabelText('Task and challenge notifications');
      expect(verification.props.accessibilityState).toMatchObject({
        checked: false,
        disabled: true,
      });
    });

    it('does not toggle a disabled category switch', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Allow push notifications'));
      (props.onChange as jest.Mock).mockClear();
      await fireEvent.press(screen.getByLabelText('Task and challenge notifications'));
      expect(props.onChange).not.toHaveBeenCalled();
    });

    it('fires back navigation', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to settings'));
      expect(props.onBack).toHaveBeenCalledTimes(1);
    });
  });
});
