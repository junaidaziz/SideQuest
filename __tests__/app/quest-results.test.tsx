import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import QuestResultsRoute from '../../app/quest-results';
import type { Mission } from '../../src/types/api';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));

const mission: Mission = {
  id: 'm-1',
  category: 'explore',
  title: 'Street Type Safari',
  desc: 'd',
  full: 'f',
  proof: 'A photo.',
  time: '30 min',
  xp: '20 XP',
  diff: 'Easy',
  dots: 1,
};

jest.mock('../../src/screens/QuestResultsScreen', () =>
  jest.fn(({ onBack, onViewDetails }: { onBack: () => void; onViewDetails: (m: unknown) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack}>
          <Text>back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="details"
          onPress={() =>
            onViewDetails({
              id: 'm-1',
              category: 'explore',
              title: 'Street Type Safari',
              desc: 'd',
              full: 'f',
              proof: 'A photo.',
              time: '30 min',
              xp: '20 XP',
              diff: 'Easy',
              dots: 1,
            })
          }
        >
          <Text>details</Text>
        </Pressable>
      </>
    );
  }),
);

const filters = JSON.stringify({ crew: 'Solo', time: '1 hour', setting: 'Anywhere', budget: 'No limit' });

describe('QuestResultsRoute', () => {
  beforeEach(() => jest.clearAllMocks());

  it('redirects to Explore when filters are missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ filters: undefined });
    const { findByText } = await render(<QuestResultsRoute />);
    expect(await findByText('redirect:/explore')).toBeTruthy();
  });

  it('redirects to Explore when filters are malformed', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ filters: 'nope' });
    const { findByText } = await render(<QuestResultsRoute />);
    expect(await findByText('redirect:/explore')).toBeTruthy();
  });

  it('goes back from the back control', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ filters });
    const { getByLabelText } = await render(<QuestResultsRoute />);
    await fireEvent.press(getByLabelText('back'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('opens quest detail with the serialized mission', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ filters });
    const { getByLabelText } = await render(<QuestResultsRoute />);
    await fireEvent.press(getByLabelText('details'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/quest/[id]',
      params: { id: 'm-1', mission: JSON.stringify(mission) },
    });
  });
});
