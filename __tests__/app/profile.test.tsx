import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileRoute from '../../app/profile';

// The old /profile route is retired in the Compass redesign — it now redirects
// to the You tab so any stale deep link still lands somewhere valid.
jest.mock('expo-router', () => ({
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));

describe('ProfileRoute (retired)', () => {
  it('redirects to the You tab', async () => {
    const { findByText } = await render(<ProfileRoute />);
    expect(await findByText('redirect:/you')).toBeTruthy();
  });
});
