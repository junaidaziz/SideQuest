import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import CompletionRoute from '../../app/completion';

// jest.mock() factories are hoisted above imports, so they can't reference
// module-scope bindings like an imported `Text` — only a lazy require()
// inside the factory works here.
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));
jest.mock('../../src/screens/CompletionScreen', () =>
  jest.fn(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>completion-screen</Text>;
  }),
);
jest.mock('../../src/store/authStore');

describe('CompletionRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { id: 'u1', email: null, displayName: null, isGuest: true } }),
    );
  });

  it('redirects to home when the result param is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ result: undefined });

    const { findByText } = await render(<CompletionRoute />);

    expect(await findByText('redirect:/home')).toBeTruthy();
  });

  it('redirects to home when the result param is not valid JSON', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ result: 'not-json' });

    const { findByText } = await render(<CompletionRoute />);

    expect(await findByText('redirect:/home')).toBeTruthy();
  });

  it('renders CompletionScreen when the result param parses cleanly', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      result: JSON.stringify({
        completionId: 'c1',
        missionTitle: 'Test Mission',
        xpAwarded: 40,
        totalXp: 40,
        currentStreak: 1,
        longestStreak: 1,
        proofUrl: null,
      }),
    });

    const { findByText } = await render(<CompletionRoute />);

    expect(await findByText('completion-screen')).toBeTruthy();
  });
});
