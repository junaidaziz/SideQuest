import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import ExploreTab from '../../app/(tabs)/explore';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../src/screens/ExploreScreen', () =>
  jest.fn(
    ({
      onSearch,
      onSelectMode,
      onSeeAll,
      onOpenQuest,
      onOpenSaved,
    }: {
      onSearch: () => void;
      onSelectMode: (id: string) => void;
      onSeeAll: (id: string) => void;
      onOpenQuest: (id: string) => void;
      onOpenSaved: () => void;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      return (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="search" onPress={onSearch}>
            <Text>search</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="mode" onPress={() => onSelectMode('get-out')}>
            <Text>mode</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="seeall" onPress={() => onSeeAll('quick-wins')}>
            <Text>seeall</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="quest" onPress={() => onOpenQuest('qw-1')}>
            <Text>quest</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="saved" onPress={onOpenSaved}>
            <Text>saved</Text>
          </Pressable>
        </>
      );
    },
  ),
);

const DEFAULT_FILTERS = JSON.stringify({ crew: 'Solo', time: '1 hour', setting: 'Anywhere', budget: 'No limit' });

describe('ExploreTab', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['search', 'mode', 'seeall'])('routes %s to /quest-results with default filters', async (label) => {
    const { getByLabelText } = await render(<ExploreTab />);
    await fireEvent.press(getByLabelText(label));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/quest-results',
      params: { filters: DEFAULT_FILTERS },
    });
  });

  it('opens a quest by id', async () => {
    const { getByLabelText } = await render(<ExploreTab />);
    await fireEvent.press(getByLabelText('quest'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'qw-1' } });
  });

  it('opens saved quests', async () => {
    const { getByLabelText } = await render(<ExploreTab />);
    await fireEvent.press(getByLabelText('saved'));
    expect(router.push).toHaveBeenCalledWith('/saved-quests');
  });
});
