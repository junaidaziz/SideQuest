import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import HomeRoute from '../../app/home';

// jest.mock() factories are hoisted above imports, so they can't reference
// module-scope bindings like an imported `Text` — only a lazy require()
// inside the factory works here.
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));
jest.mock('../../src/screens/HomeScreen', () =>
  jest.fn(
    ({
      onStartNewQuest,
      onSelectDailyMission,
      onOpenProfile,
    }: {
      onStartNewQuest: () => void;
      onSelectDailyMission: () => void;
      onOpenProfile: () => void;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      return (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel="start" onPress={onStartNewQuest}>
            <Text>start</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="daily"
            onPress={onSelectDailyMission}
          >
            <Text>daily</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="profile" onPress={onOpenProfile}>
            <Text>profile</Text>
          </Pressable>
        </>
      );
    },
  ),
);

describe('HomeRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to mode-select when starting a new quest', async () => {
    const { getByLabelText } = await render(<HomeRoute />);

    await fireEvent.press(getByLabelText('start'));

    expect(router.push).toHaveBeenCalledWith('/mode-select');
  });

  it('navigates to mode-select when selecting the daily mission', async () => {
    const { getByLabelText } = await render(<HomeRoute />);

    await fireEvent.press(getByLabelText('daily'));

    expect(router.push).toHaveBeenCalledWith('/mode-select');
  });

  it('navigates to profile when opening the profile icon', async () => {
    const { getByLabelText } = await render(<HomeRoute />);

    await fireEvent.press(getByLabelText('profile'));

    expect(router.push).toHaveBeenCalledWith('/profile');
  });
});
