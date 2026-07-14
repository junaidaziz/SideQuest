import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import MissionResultsRoute from '../../app/mission-results';

// The old /mission-results route is retired in the Compass redesign — it now
// forwards to /quest-results, preserving any filters param on the way.
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  Redirect: jest.fn(({ href }: { href: string | { pathname: string; params?: Record<string, string> } }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    const label = typeof href === 'string' ? href : `${href.pathname}?${JSON.stringify(href.params)}`;
    return <Text>{`redirect:${label}`}</Text>;
  }),
}));

describe('MissionResultsRoute (retired)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the filters param to /quest-results', async () => {
    const filters = JSON.stringify({ crew: 'Solo', time: '1 hour', setting: 'Anywhere', budget: 'No limit' });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ filters });

    const { findByText } = await render(<MissionResultsRoute />);

    expect(await findByText(`redirect:/quest-results?${JSON.stringify({ filters })}`)).toBeTruthy();
  });

  it('redirects to Explore when no filters param is present', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ filters: undefined });

    const { findByText } = await render(<MissionResultsRoute />);

    expect(await findByText('redirect:/explore')).toBeTruthy();
  });
});
