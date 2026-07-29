import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import LoginRoute from '../../app/login';

// jest.mock() factories are hoisted above imports, so they can't reference
// module-scope bindings like an imported `Text` — only a lazy require()
// inside the factory works here.
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
}));
jest.mock('../../src/screens/LoginScreen', () =>
  jest.fn(
    ({
      onSuccess,
      onBack,
      onGoToSignup,
      onGoToForgotPassword,
    }: {
      onSuccess: () => void;
      onBack: () => void;
      onGoToSignup: () => void;
      onGoToForgotPassword: () => void;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      return (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="success" onPress={onSuccess}>
            <Text>success</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack}>
            <Text>back</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="signup" onPress={onGoToSignup}>
            <Text>signup</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="forgot"
            onPress={onGoToForgotPassword}
          >
            <Text>forgot</Text>
          </Pressable>
        </>
      );
    },
  ),
);

describe('LoginRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replaces with the Today tab on a successful login', async () => {
    const { getByLabelText } = await render(<LoginRoute />);

    await fireEvent.press(getByLabelText('success'));

    expect(router.replace).toHaveBeenCalledWith('/today');
  });

  it('goes back when the back button is pressed', async () => {
    const { getByLabelText } = await render(<LoginRoute />);

    await fireEvent.press(getByLabelText('back'));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('replaces with signup-prompt when going to signup', async () => {
    const { getByLabelText } = await render(<LoginRoute />);

    await fireEvent.press(getByLabelText('signup'));

    expect(router.replace).toHaveBeenCalledWith('/signup-prompt');
  });

  it('pushes the forgot-password route when Forgot password is pressed', async () => {
    const { getByLabelText } = await render(<LoginRoute />);

    await fireEvent.press(getByLabelText('forgot'));

    // push, not replace — the user can back out and keep their typed email.
    expect(router.push).toHaveBeenCalledWith('/forgot-password');
  });
});
