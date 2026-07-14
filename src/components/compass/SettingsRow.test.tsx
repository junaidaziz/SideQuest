import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsRow } from './SettingsRow';

describe('SettingsRow', () => {
  describe('rendering', () => {
    it('renders label, sub and value', async () => {
      const { getByText } = await render(
        <SettingsRow icon="🎨" label="Appearance" sub="Theme" value="Dark" />,
      );
      expect(getByText('Appearance')).toBeTruthy();
      expect(getByText('Theme')).toBeTruthy();
      expect(getByText('Dark')).toBeTruthy();
    });

    it('renders a custom accessory instead of a value', async () => {
      const { getByText, queryByText } = await render(
        <SettingsRow
          label="Sound"
          value="ignored"
          accessory={<Text>ACCESSORY</Text>}
        />,
      );
      expect(getByText('ACCESSORY')).toBeTruthy();
      expect(queryByText('ignored')).toBeNull();
    });

    it('renders as a static labelled container when no onPress is given', async () => {
      const { getByLabelText } = await render(
        <SettingsRow label="Email" sub="alex@example.com" accessibilityLabel="Email row" />,
      );
      const row = getByLabelText('Email row');
      expect(row.props.accessibilityRole).toBeUndefined();
    });
  });

  describe('interactions', () => {
    it('fires onPress and exposes a button role with a chevron', async () => {
      const onPress = jest.fn();
      const { getByRole } = await render(
        <SettingsRow
          label="Account and security"
          onPress={onPress}
          showChevron
          accessibilityHint="Opens account settings"
        />,
      );
      const btn = getByRole('button');
      expect(btn.props.accessibilityLabel).toBe('Account and security');
      expect(btn.props.accessibilityHint).toBe('Opens account settings');
      fireEvent.press(btn);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not fire onPress when disabled', async () => {
      const onPress = jest.fn();
      const { getByRole } = await render(
        <SettingsRow label="Locked" onPress={onPress} disabled />,
      );
      fireEvent.press(getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
      expect(getByRole('button').props.accessibilityState).toMatchObject({
        disabled: true,
      });
    });

    it('applies destructive styling by rendering without a chevron by default', async () => {
      const { getByText } = await render(
        <SettingsRow label="Delete account" destructive onPress={jest.fn()} />,
      );
      expect(getByText('Delete account')).toBeTruthy();
    });
  });
});
