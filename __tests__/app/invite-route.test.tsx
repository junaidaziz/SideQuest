import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import InviteRoute from '../../app/tasks/invite/[token]';
import { usePendingInviteStore } from '../../src/store/pendingInviteStore';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ token: 'tok-1' })),
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { isGuest: boolean } }) => unknown) =>
    selector({ user: { isGuest: true } }),
}));
jest.mock('../../src/screens/InviteLandingScreen', () =>
  jest.fn(
    ({
      token,
      isGuest,
      onAccepted,
      onDeclined,
      onSignInFirst,
      onBack,
    }: {
      token: string;
      isGuest: boolean;
      onAccepted: (id: string) => void;
      onDeclined: () => void;
      onSignInFirst: () => void;
      onBack: () => void;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      return (
        <>
          <Text>{`token:${token}:${isGuest}`}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="accept" onPress={() => onAccepted('task-9')}>
            <Text>a</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="decline" onPress={onDeclined}>
            <Text>d</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="signin" onPress={onSignInFirst}>
            <Text>s</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack}>
            <Text>b</Text>
          </Pressable>
        </>
      );
    },
  ),
);

describe('InviteRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePendingInviteStore.setState({ token: null });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ token: 'tok-1' });
  });

  it('passes the token and guest flag through', async () => {
    const { findByText } = await render(<InviteRoute />);
    expect(await findByText('token:tok-1:true')).toBeTruthy();
  });

  it('replaces to the challenge detail on accept', async () => {
    const { getByLabelText } = await render(<InviteRoute />);
    await fireEvent.press(getByLabelText('accept'));
    expect(router.replace).toHaveBeenCalledWith({ pathname: '/challenges/[id]', params: { id: 'task-9' } });
  });

  it('replaces to the feed on decline', async () => {
    const { getByLabelText } = await render(<InviteRoute />);
    await fireEvent.press(getByLabelText('decline'));
    expect(router.replace).toHaveBeenCalledWith('/challenges');
  });

  it('stashes the token and routes to login on sign-in-first', async () => {
    const { getByLabelText } = await render(<InviteRoute />);
    await fireEvent.press(getByLabelText('signin'));
    expect(usePendingInviteStore.getState().token).toBe('tok-1');
    expect(router.push).toHaveBeenCalledWith('/login');
  });

  it('goes back from the back action', async () => {
    const { getByLabelText } = await render(<InviteRoute />);
    await fireEvent.press(getByLabelText('back'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('redirects to the feed when the token is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ token: undefined });
    const { findByText } = await render(<InviteRoute />);
    expect(await findByText('redirect:/challenges')).toBeTruthy();
  });
});
