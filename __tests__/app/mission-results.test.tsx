import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import MissionResultsRoute from '../../app/mission-results';

// jest.mock() factories are hoisted above imports, so they can't reference
// module-scope bindings like an imported `Text` — only a lazy require()
// inside the factory works here.
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: jest.fn(),
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));
jest.mock('../../src/screens/MissionResultsScreen', () =>
  jest.fn(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>mission-results-screen</Text>;
  }),
);

describe('MissionResultsRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to onboarding when the filters param is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ filters: undefined });

    const { findByText } = await render(<MissionResultsRoute />);

    expect(await findByText('redirect:/onboarding')).toBeTruthy();
  });

  it('redirects to onboarding when the filters param is not valid JSON', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ filters: 'not-json' });

    const { findByText } = await render(<MissionResultsRoute />);

    expect(await findByText('redirect:/onboarding')).toBeTruthy();
  });

  it('renders MissionResultsScreen when the filters param parses cleanly', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      filters: JSON.stringify({ crew: 'Solo', time: '30 min', setting: 'Outdoors', budget: 'Free' }),
    });

    const { findByText } = await render(<MissionResultsRoute />);

    expect(await findByText('mission-results-screen')).toBeTruthy();
  });
});
