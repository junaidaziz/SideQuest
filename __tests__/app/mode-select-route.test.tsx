import React from 'react';
import { render } from '@testing-library/react-native';
import ModeSelectRoute from '../../app/mode-select';

// The old /mode-select route is retired in the Compass redesign — the Explore
// tab's own mode-tile UI replaces it, so this route now redirects to Explore.
// (toFiltersFromMode remains exported and is covered by mode-select.test.ts.)
jest.mock('expo-router', () => ({
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));

describe('ModeSelectRoute (retired)', () => {
  it('redirects to the Explore tab', async () => {
    const { findByText } = await render(<ModeSelectRoute />);
    expect(await findByText('redirect:/explore')).toBeTruthy();
  });
});
