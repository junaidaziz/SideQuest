import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import ProofSubmissionRoute from '../../app/proof-submission/[missionId]';

// jest.mock() factories are hoisted above imports, so they can't reference
// module-scope bindings like an imported `Text` — only a lazy require()
// inside the factory works here.
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));
jest.mock('../../src/screens/ProofSubmissionScreen', () =>
  jest.fn(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>proof-submission-screen</Text>;
  }),
);

describe('ProofSubmissionRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to mode-select when missionId is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      missionId: undefined,
      proofRequirement: 'A photo.',
    });

    const { findByText } = await render(<ProofSubmissionRoute />);

    expect(await findByText('redirect:/mode-select')).toBeTruthy();
  });

  it('redirects to mode-select when proofRequirement is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      missionId: 'm-1',
      proofRequirement: undefined,
    });

    const { findByText } = await render(<ProofSubmissionRoute />);

    expect(await findByText('redirect:/mode-select')).toBeTruthy();
  });

  it('renders ProofSubmissionScreen when both params are present', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      missionId: 'm-1',
      proofRequirement: 'A photo.',
    });

    const { findByText } = await render(<ProofSubmissionRoute />);

    expect(await findByText('proof-submission-screen')).toBeTruthy();
  });
});
