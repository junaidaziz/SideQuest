import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import SavedQuestsRoute from '../../app/saved-quests';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

const mission = {
  id: 'm-1',
  category: 'explore',
  title: 'Street Type Safari',
  desc: 'd',
  full: 'f',
  proof: 'A photo.',
  time: '30 min',
  xp: '+20 XP',
  diff: 'Easy',
  dots: 1,
  savedAt: '2026-07-16T10:00:00.000Z',
};

jest.mock('../../src/screens/SavedQuestsScreen', () =>
  jest.fn(
    ({
      onBack,
      onExplore,
      onViewDetails,
    }: {
      onBack: () => void;
      onExplore: () => void;
      onViewDetails: (m: unknown) => void;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      return (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="back" onPress={onBack}>
            <Text>back</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="explore" onPress={onExplore}>
            <Text>explore</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="details" onPress={() => onViewDetails(mission)}>
            <Text>details</Text>
          </Pressable>
        </>
      );
    },
  ),
);

describe('SavedQuestsRoute', () => {
  beforeEach(() => jest.clearAllMocks());

  it('goes back', async () => {
    const { getByLabelText } = await render(<SavedQuestsRoute />);
    await fireEvent.press(getByLabelText('back'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('routes to Explore', async () => {
    const { getByLabelText } = await render(<SavedQuestsRoute />);
    await fireEvent.press(getByLabelText('explore'));
    expect(router.push).toHaveBeenCalledWith('/explore');
  });

  it('opens quest details with the serialized mission', async () => {
    const { getByLabelText } = await render(<SavedQuestsRoute />);
    await fireEvent.press(getByLabelText('details'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/quest/[id]',
      params: { id: 'm-1', mission: JSON.stringify(mission) },
    });
  });
});
