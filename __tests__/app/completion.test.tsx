import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import CompletionRoute from '../../app/completion';

// The Compass redesign renders CompletionScreenV2 here (replacing the old
// CompletionScreen) and falls back to the Today tab when no result is present.
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));
jest.mock('../../src/screens/CompletionScreenV2', () =>
  jest.fn(
    ({
      onBackToToday,
      onOpenNextIdea,
      onCreateAccount,
      onShare,
    }: {
      onBackToToday: () => void;
      onOpenNextIdea: () => void;
      onCreateAccount: () => void;
      onShare?: () => void;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      return (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="today" onPress={onBackToToday}>
            <Text>today</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="next" onPress={onOpenNextIdea}>
            <Text>next</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="signup" onPress={onCreateAccount}>
            <Text>signup</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="share" onPress={onShare}>
            <Text>share</Text>
          </Pressable>
        </>
      );
    },
  ),
);
jest.mock('../../src/store/authStore');

const validResult = JSON.stringify({
  completionId: 'c1',
  missionTitle: 'Test Mission',
  xpAwarded: 40,
  totalXp: 40,
  currentStreak: 1,
  longestStreak: 1,
  proofUrl: null,
});

describe('CompletionRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { id: 'u1', email: null, displayName: null, isGuest: true } }),
    );
  });

  it('redirects to the Today tab when the result param is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ result: undefined });
    const { findByText } = await render(<CompletionRoute />);
    expect(await findByText('redirect:/today')).toBeTruthy();
  });

  it('redirects to the Today tab when the result param is not valid JSON', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ result: 'not-json' });
    const { findByText } = await render(<CompletionRoute />);
    expect(await findByText('redirect:/today')).toBeTruthy();
  });

  it('replaces to the Today tab from the primary CTA', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ result: validResult });
    const { getByLabelText } = await render(<CompletionRoute />);
    await fireEvent.press(getByLabelText('today'));
    expect(router.replace).toHaveBeenCalledWith('/today');
  });

  it('replaces to Explore from the next-idea CTA', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ result: validResult });
    const { getByLabelText } = await render(<CompletionRoute />);
    await fireEvent.press(getByLabelText('next'));
    expect(router.replace).toHaveBeenCalledWith('/explore');
  });

  it('pushes the signup prompt from the create-account CTA', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ result: validResult });
    const { getByLabelText } = await render(<CompletionRoute />);
    await fireEvent.press(getByLabelText('signup'));
    expect(router.push).toHaveBeenCalledWith('/signup-prompt');
  });

  it('shares a real message via the native share sheet, not a silent no-op', async () => {
    // Regression test: an independent review found the Share button on this
    // screen was rendered, labelled, and announced to a screen reader, but
    // wired to nothing — this locks in the fix.
    const spy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ result: validResult });
    const { getByLabelText } = await render(<CompletionRoute />);
    await fireEvent.press(getByLabelText('share'));
    expect(spy).toHaveBeenCalledWith({ message: expect.stringContaining('Test Mission') });
    expect(spy).toHaveBeenCalledWith({ message: expect.stringContaining('40 XP') });
  });
});
