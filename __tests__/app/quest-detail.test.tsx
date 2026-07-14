import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import QuestDetailRoute from '../../app/quest/[id]';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
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

let received: { mission: unknown } = { mission: undefined };
jest.mock('../../src/screens/QuestDetailScreen', () =>
  jest.fn(({ mission: m, onBack, onAccept, onRetry }: { mission: unknown; onBack: () => void; onAccept: (x: unknown) => void; onRetry: () => void }) => {
    received = { mission: m };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack}><Text>back</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="retry" onPress={onRetry}><Text>retry</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="accept" onPress={() => onAccept(m)}><Text>accept</Text></Pressable>
      </>
    );
  }),
);

describe('QuestDetailRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    received = { mission: undefined };
  });

  it('passes the parsed mission to the screen', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mission: JSON.stringify(mission) });
    await render(<QuestDetailRoute />);
    expect(received.mission).toEqual(mission);
  });

  it('leaves mission undefined when the param is absent or malformed', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mission: 'nope' });
    await render(<QuestDetailRoute />);
    expect(received.mission).toBeUndefined();
  });

  it('goes back from back and retry', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mission: JSON.stringify(mission) });
    const { getByLabelText } = await render(<QuestDetailRoute />);
    await fireEvent.press(getByLabelText('back'));
    await fireEvent.press(getByLabelText('retry'));
    expect(router.back).toHaveBeenCalledTimes(2);
  });

  it('accepts into the active quest with the serialized mission', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mission: JSON.stringify(mission) });
    const { getByLabelText } = await render(<QuestDetailRoute />);
    await fireEvent.press(getByLabelText('accept'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/quest/active/[id]',
      params: { id: 'm-1', mission: JSON.stringify(mission) },
    });
  });
});
