import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import SettingsScreen from './SettingsScreen';

async function renderScreen(overrides: Partial<React.ComponentProps<typeof SettingsScreen>> = {}) {
  const props = {
    onBack: jest.fn(),
    onAccountSecurity: jest.fn(),
    onPrivacy: jest.fn(),
    onNotifications: jest.fn(),
    onAppearance: jest.fn(),
    onAccessibility: jest.fn(),
    onData: jest.fn(),
    onHelp: jest.fn(),
    onLegal: jest.fn(),
    onAbout: jest.fn(),
    onLogout: jest.fn(),
    ...overrides,
  };
  await render(<SettingsScreen {...props} />);
  return props;
}

describe('SettingsScreen', () => {
  describe('rendering', () => {
    it('renders the grouped section headers', async () => {
      await renderScreen();
      expect(screen.getByText('ACCOUNT')).toBeTruthy();
      expect(screen.getByText('APP')).toBeTruthy();
      expect(screen.getByText('SUPPORT')).toBeTruthy();
    });

    it('renders the app version metadata', async () => {
      await renderScreen();
      expect(screen.getByText('SideQuest 2.4.0 (build 1487)')).toBeTruthy();
    });

    it('shows the passed appearance value on the Appearance row', async () => {
      await renderScreen({ appearanceValue: 'Dark' });
      expect(screen.getByText('Dark')).toBeTruthy();
    });
  });

  describe('navigation', () => {
    it.each([
      ['Account and security', 'onAccountSecurity'],
      ['Privacy', 'onPrivacy'],
      ['Notifications', 'onNotifications'],
      ['Appearance', 'onAppearance'],
      ['Accessibility', 'onAccessibility'],
      ['Data', 'onData'],
      ['Help', 'onHelp'],
      ['Legal', 'onLegal'],
      ['About SideQuest', 'onAbout'],
    ] as const)('routes %s through %s', async (label, handler) => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText(label));
      expect(props[handler]).toHaveBeenCalledTimes(1);
    });

    it('fires logout and back', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Log out'));
      expect(props.onLogout).toHaveBeenCalledTimes(1);
      await fireEvent.press(screen.getByLabelText('Back to profile'));
      expect(props.onBack).toHaveBeenCalledTimes(1);
    });
  });
});
