import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import ModeSelectRoute from '../../app/mode-select';

// jest.mock() factories are hoisted above imports, so they can't reference
// module-scope bindings like an imported `Text` — only a lazy require()
// inside the factory works here.
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));
jest.mock('../../src/screens/ModeSelectScreen', () =>
  jest.fn(({ onSelectMode }: { onSelectMode: (mode: string) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="solo"
          onPress={() => onSelectMode('solo')}
        >
          <Text>solo</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="city"
          onPress={() => onSelectMode('city')}
        >
          <Text>city</Text>
        </Pressable>
      </>
    );
  }),
);

describe('ModeSelectRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to mission-results with a crew-mapped mode\'s filters', async () => {
    const { getByLabelText } = await render(<ModeSelectRoute />);

    await fireEvent.press(getByLabelText('solo'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/mission-results',
      params: {
        filters: JSON.stringify({
          crew: 'Solo',
          time: '1 hour',
          setting: 'Anywhere',
          budget: 'No limit',
        }),
      },
    });
  });

  it('navigates to mission-results with a setting-mapped mode\'s filters', async () => {
    const { getByLabelText } = await render(<ModeSelectRoute />);

    await fireEvent.press(getByLabelText('city'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/mission-results',
      params: {
        filters: JSON.stringify({
          crew: 'Solo',
          time: '1 hour',
          setting: 'City',
          budget: 'No limit',
        }),
      },
    });
  });
});
