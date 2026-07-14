import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ActiveQuestRoute from '../../app/quest/active/[id]';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));

const mission = {
  id: 'm-1',
  category: 'social',
  title: 'Street Type Safari',
  desc: 'd',
  full: 'f',
  proof: 'A photo.',
  time: '30 min',
  xp: '20 XP',
  diff: 'Easy',
  dots: 1,
};

jest.mock('../../src/screens/ActiveQuestScreen', () =>
  jest.fn(({ onBack, onReadyToFinish, onRetry }: { onBack: () => void; onReadyToFinish: (m: unknown) => void; onRetry: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack}><Text>back</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="retry" onPress={onRetry}><Text>retry</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="finish" onPress={() => onReadyToFinish(mission)}><Text>finish</Text></Pressable>
      </>
    );
  }),
);

describe('ActiveQuestRoute', () => {
  beforeEach(() => jest.clearAllMocks());

  it('redirects to Explore when no mission param is present', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mission: undefined });
    const { findByText } = await render(<ActiveQuestRoute />);
    expect(await findByText('redirect:/explore')).toBeTruthy();
  });

  it('redirects to Explore when the mission param is malformed', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mission: 'nope' });
    const { findByText } = await render(<ActiveQuestRoute />);
    expect(await findByText('redirect:/explore')).toBeTruthy();
  });

  it('goes back from back and retry', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mission: JSON.stringify(mission) });
    const { getByLabelText } = await render(<ActiveQuestRoute />);
    await fireEvent.press(getByLabelText('back'));
    await fireEvent.press(getByLabelText('retry'));
    expect(router.back).toHaveBeenCalledTimes(2);
  });

  it('advances to proof submission with the mission fields', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mission: JSON.stringify(mission) });
    const { getByLabelText } = await render(<ActiveQuestRoute />);
    await fireEvent.press(getByLabelText('finish'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/proof/[missionId]',
      params: { missionId: 'm-1', missionTitle: 'Street Type Safari', proofRequirement: 'A photo.' },
    });
  });
});
