import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import YouTab from '../../app/(tabs)/you';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('../../src/screens/YouScreen', () =>
  jest.fn(
    ({
      onSettings,
      onEditProfile,
      onPaymentMethods,
      onCreateAccount,
      onLoginExisting,
      onLoggedOut,
    }: Record<string, () => void>) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      const btn = (label: string, onPress: () => void) => (
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
          <Text>{label}</Text>
        </Pressable>
      );
      return (
        <>
          {btn('settings', onSettings)}
          {btn('edit', onEditProfile)}
          {btn('payment', onPaymentMethods)}
          {btn('create', onCreateAccount)}
          {btn('login', onLoginExisting)}
          {btn('loggedout', onLoggedOut)}
        </>
      );
    },
  ),
);

describe('YouTab', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['settings', '/settings'],
    ['edit', '/settings/edit-profile'],
    ['payment', '/payment-methods'],
    ['create', '/signup-prompt'],
    ['login', '/login'],
  ])('pushes %s to %s', async (label, target) => {
    const { getByLabelText } = await render(<YouTab />);
    await fireEvent.press(getByLabelText(label));
    expect(router.push).toHaveBeenCalledWith(target);
  });

  it('replaces to the Today tab after logout', async () => {
    const { getByLabelText } = await render(<YouTab />);
    await fireEvent.press(getByLabelText('loggedout'));
    expect(router.replace).toHaveBeenCalledWith('/today');
  });
});
