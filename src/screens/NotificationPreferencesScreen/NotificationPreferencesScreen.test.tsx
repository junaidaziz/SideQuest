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
    it('renders the grouped sections and quiet-hours range', async () => {
      await renderScreen();
      expect(screen.getByText('PUSH NOTIFICATIONS')).toBeTruthy();
      expect(screen.getByText('WHAT YOU HEAR ABOUT')).toBeTruthy();
      expect(screen.getByLabelText('Quiet hours from 10:00 PM to 7:00 AM')).toBeTruthy();
    });

    it('reflects the default preference switch states', async () => {
      await renderScreen();
      expect(
        screen.getByLabelText('Allow push notifications').props.accessibilityState,
      ).toMatchObject({ checked: true });
      expect(
        screen.getByLabelText('Group notifications').props.accessibilityState,
      ).toMatchObject({ checked: false });
    });

    it('accepts injected initial preferences', async () => {
      await renderScreen({
        initialPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES, challenges: false },
      });
      expect(
        screen.getByLabelText('Challenge notifications').props.accessibilityState,
      ).toMatchObject({ checked: false });
    });
  });

  describe('interactions', () => {
    it('toggles a category and reports the change', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Group notifications'));
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ groups: true }),
      );
      expect(
        screen.getByLabelText('Group notifications').props.accessibilityState,
      ).toMatchObject({ checked: true });
    });

    it('disables and blanks category switches when push is turned off', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Allow push notifications'));
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ pushEnabled: false }),
      );
      const verification = screen.getByLabelText('Quest verification notifications');
      expect(verification.props.accessibilityState).toMatchObject({
        checked: false,
        disabled: true,
      });
    });

    it('does not toggle a disabled category switch', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Allow push notifications'));
      (props.onChange as jest.Mock).mockClear();
      await fireEvent.press(screen.getByLabelText('Challenge notifications'));
      expect(props.onChange).not.toHaveBeenCalled();
    });

    it('toggles the quiet-hours mute switch', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Mute during quiet hours'));
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ quietHours: false }),
      );
    });

    it('fires back navigation', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to settings'));
      expect(props.onBack).toHaveBeenCalledTimes(1);
    });
  });
});
