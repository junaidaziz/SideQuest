import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import SignupPromptRoute from '../../app/signup-prompt';

// jest.mock() factories are hoisted above imports, so they can't reference
// module-scope bindings like an imported `Text` — only a lazy require()
// inside the factory works here.
jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
}));
jest.mock('../../src/screens/SignupPromptScreen', () =>
  jest.fn(
    ({ onSuccess, onDismiss }: { onSuccess: () => void; onDismiss: () => void }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      return (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="success" onPress={onSuccess}>
            <Text>success</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="dismiss" onPress={onDismiss}>
            <Text>dismiss</Text>
          </Pressable>
        </>
      );
    },
  ),
);

describe('SignupPromptRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('goes back on successful signup', async () => {
    const { getByLabelText } = await render(<SignupPromptRoute />);

    await fireEvent.press(getByLabelText('success'));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('goes back on dismiss', async () => {
    const { getByLabelText } = await render(<SignupPromptRoute />);

    await fireEvent.press(getByLabelText('dismiss'));

    expect(router.back).toHaveBeenCalledTimes(1);
  });
});
