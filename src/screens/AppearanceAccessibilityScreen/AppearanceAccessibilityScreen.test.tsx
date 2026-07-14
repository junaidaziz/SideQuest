import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import AppearanceAccessibilityScreen, {
  DEFAULT_APPEARANCE_SETTINGS,
} from './AppearanceAccessibilityScreen';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(() => Promise.resolve()) }));

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof AppearanceAccessibilityScreen>> = {},
) {
  const props = {
    onBack: jest.fn(),
    onChange: jest.fn(),
    onOpenTextSettings: jest.fn(),
    ...overrides,
  };
  await render(<AppearanceAccessibilityScreen {...props} />);
  return props;
}

describe('AppearanceAccessibilityScreen', () => {
  describe('rendering', () => {
    it('renders the theme radio group with the default selection', async () => {
      await renderScreen();
      const system = screen.getByLabelText('System theme');
      expect(system.props.accessibilityRole).toBe('radio');
      expect(system.props.accessibilityState).toMatchObject({ selected: true });
      expect(screen.getByLabelText('Dark theme').props.accessibilityState).toMatchObject({
        selected: false,
      });
    });

    it('renders the motion and accessibility switches', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Reduce motion')).toBeTruthy();
      expect(screen.getByLabelText('Haptics')).toBeTruthy();
      expect(screen.getByLabelText('Sound')).toBeTruthy();
      expect(screen.getByLabelText('High contrast')).toBeTruthy();
    });

    it('accepts injected initial settings', async () => {
      await renderScreen({
        initialSettings: { ...DEFAULT_APPEARANCE_SETTINGS, theme: 'dark', highContrast: true },
      });
      expect(screen.getByLabelText('Dark theme').props.accessibilityState).toMatchObject({
        selected: true,
      });
      expect(screen.getByLabelText('High contrast').props.accessibilityState).toMatchObject({
        checked: true,
      });
    });
  });

  describe('interactions', () => {
    it('selects a theme and reports the change', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Dark theme'));
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ theme: 'dark' }),
      );
      expect(screen.getByLabelText('Dark theme').props.accessibilityState).toMatchObject({
        selected: true,
      });
    });

    it('toggles reduce motion', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Reduce motion'));
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ reduceMotion: true }),
      );
    });

    it('toggles haptics off', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Haptics'));
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ haptics: false }),
      );
    });

    it('toggles high contrast', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('High contrast'));
      expect(props.onChange).toHaveBeenCalledWith(
        expect.objectContaining({ highContrast: true }),
      );
    });

    it('opens device text settings and navigates back', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Open device text settings'));
      expect(props.onOpenTextSettings).toHaveBeenCalledTimes(1);
      await fireEvent.press(screen.getByLabelText('Back to settings'));
      expect(props.onBack).toHaveBeenCalledTimes(1);
    });
  });
});
