import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import ForgotPasswordRoute from '../../app/forgot-password';
import { forgotPassword } from '../../src/services/authApi';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));

jest.mock('../../src/services/authApi', () => ({
  forgotPassword: jest.fn(),
}));

// jest.mock() factories are hoisted above imports, so the mock screen requires
// react-native lazily inside the factory rather than referencing an import.
jest.mock('../../src/screens/ForgotPasswordScreen', () =>
  jest.fn(
    ({
      onSubmit,
      onBack,
    }: {
      onSubmit: (email: string) => Promise<void>;
      onBack: () => void;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      return (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="submit"
            onPress={() => onSubmit('quester@example.com')}
          >
            <Text>submit</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack}>
            <Text>back</Text>
          </Pressable>
        </>
      );
    },
  ),
);

describe('ForgotPasswordRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (forgotPassword as jest.Mock).mockResolvedValue({ success: true });
  });

  it('calls forgotPassword with the submitted email', async () => {
    const { getByLabelText } = await render(<ForgotPasswordRoute />);

    await fireEvent.press(getByLabelText('submit'));

    await waitFor(() =>
      expect(forgotPassword).toHaveBeenCalledWith({
        email: 'quester@example.com',
      }),
    );
  });

  it('goes back when the back action fires', async () => {
    const { getByLabelText } = await render(<ForgotPasswordRoute />);

    await fireEvent.press(getByLabelText('back'));

    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
