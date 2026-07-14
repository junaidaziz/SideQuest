import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ChallengeFeedRoute from '../../app/challenges/index';
import ChallengeDetailRoute from '../../app/challenges/[id]';
import CreateChallengeRoute from '../../app/challenges/create';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ id: 't-1' })),
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } }) => unknown) => selector({ user: { id: 'u-1' } }),
}));

jest.mock('../../src/screens/ChallengeFeedScreen', () =>
  jest.fn(({ onBack, onCreateChallenge, onOpenChallenge }: { onBack: () => void; onCreateChallenge: () => void; onOpenChallenge: (id: string) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack}><Text>b</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="create" onPress={onCreateChallenge}><Text>c</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="open" onPress={() => onOpenChallenge('t-9')}><Text>o</Text></Pressable>
      </>
    );
  }),
);
jest.mock('../../src/screens/ChallengeDetailScreen', () =>
  jest.fn(({ taskId, currentUserId, onBack, onShareInvite }: { taskId: string; currentUserId: string; onBack: () => void; onShareInvite: (u: string) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Text>{`task:${taskId}:${currentUserId}`}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack}><Text>b</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="share" onPress={() => onShareInvite('https://sq/c')}><Text>s</Text></Pressable>
      </>
    );
  }),
);
jest.mock('../../src/screens/CreateChallengeScreen', () =>
  jest.fn(({ onCancel, onCreated, onShareInvite }: { onCancel: () => void; onCreated: (id: string) => void; onShareInvite: (u: string) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="cancel" onPress={onCancel}><Text>c</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="created" onPress={() => onCreated('t-42')}><Text>cr</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="share" onPress={() => onShareInvite('https://sq/c')}><Text>s</Text></Pressable>
      </>
    );
  }),
);

describe('ChallengeFeedRoute', () => {
  beforeEach(() => jest.clearAllMocks());
  it('backs, creates, and opens a challenge', async () => {
    const { getByLabelText } = await render(<ChallengeFeedRoute />);
    await fireEvent.press(getByLabelText('back'));
    expect(router.back).toHaveBeenCalledTimes(1);
    await fireEvent.press(getByLabelText('create'));
    expect(router.push).toHaveBeenCalledWith('/challenges/create');
    await fireEvent.press(getByLabelText('open'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/challenges/[id]', params: { id: 't-9' } });
  });
});

describe('ChallengeDetailRoute', () => {
  beforeEach(() => jest.clearAllMocks());
  it('passes taskId + currentUserId and shares an invite', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 't-1' });
    const spy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    const { getByLabelText, findByText } = await render(<ChallengeDetailRoute />);
    expect(await findByText('task:t-1:u-1')).toBeTruthy();
    await fireEvent.press(getByLabelText('share'));
    expect(spy).toHaveBeenCalledWith({ message: 'https://sq/c' });
  });

  it('redirects to the feed when id is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: undefined });
    const { findByText } = await render(<ChallengeDetailRoute />);
    expect(await findByText('redirect:/challenges')).toBeTruthy();
  });
});

describe('CreateChallengeRoute', () => {
  beforeEach(() => jest.clearAllMocks());
  it('cancels, creates (replace), and shares', async () => {
    const spy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    const { getByLabelText } = await render(<CreateChallengeRoute />);
    await fireEvent.press(getByLabelText('cancel'));
    expect(router.back).toHaveBeenCalledTimes(1);
    await fireEvent.press(getByLabelText('created'));
    expect(router.replace).toHaveBeenCalledWith({ pathname: '/challenges/[id]', params: { id: 't-42' } });
    await fireEvent.press(getByLabelText('share'));
    expect(spy).toHaveBeenCalledWith({ message: 'https://sq/c' });
  });
});
