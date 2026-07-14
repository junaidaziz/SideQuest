import React from 'react';
import { render } from '@testing-library/react-native';
import HomeRoute from '../../app/home';

// The old /home route is retired in the Compass redesign — it now redirects to
// the Today tab so any stale deep link still lands somewhere valid.
jest.mock('expo-router', () => ({
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));

describe('HomeRoute (retired)', () => {
  it('redirects to the Today tab', async () => {
    const { findByText } = await render(<HomeRoute />);
    expect(await findByText('redirect:/today')).toBeTruthy();
  });
});
