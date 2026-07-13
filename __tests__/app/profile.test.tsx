import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import ProfileRoute from '../../app/profile';

// jest.mock() factories are hoisted above imports, so they can't reference
// module-scope bindings like an imported `Text` — only a lazy require()
// inside the factory works here.
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock('../../src/screens/ProfileScreen', () =>
  jest.fn(
    ({
      onBack,
      onCreateAccount,
      onLoginExisting,
      onLoggedOut,
    }: {
      onBack: () => void;
      onCreateAccount: () => void;
      onLoginExisting: () => void;
      onLoggedOut: () => void;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      return (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack}>
            <Text>back</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="create-account"
            onPress={onCreateAccount}
          >
            <Text>create-account</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="login-existing"
            onPress={onLoginExisting}
          >
            <Text>login-existing</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="logged-out" onPress={onLoggedOut}>
            <Text>logged-out</Text>
          </Pressable>
        </>
      );
    },
  ),
);

describe('ProfileRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('goes back when the back button is pressed', async () => {
    const { getByLabelText } = await render(<ProfileRoute />);

    await fireEvent.press(getByLabelText('back'));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('pushes signup-prompt when creating an account', async () => {
    const { getByLabelText } = await render(<ProfileRoute />);

    await fireEvent.press(getByLabelText('create-account'));

    expect(router.push).toHaveBeenCalledWith('/signup-prompt');
  });

  it('pushes login when logging in to an existing account', async () => {
    const { getByLabelText } = await render(<ProfileRoute />);

    await fireEvent.press(getByLabelText('login-existing'));

    expect(router.push).toHaveBeenCalledWith('/login');
  });

  it('replaces with home once logged out', async () => {
    const { getByLabelText } = await render(<ProfileRoute />);

    await fireEvent.press(getByLabelText('logged-out'));

    expect(router.replace).toHaveBeenCalledWith('/home');
  });
});
