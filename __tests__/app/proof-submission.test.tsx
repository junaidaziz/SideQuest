import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import ProofSubmissionRoute from '../../app/proof-submission/[missionId]';

// The old /proof-submission/[missionId] route is retired in the Compass
// redesign — it now forwards to /proof/[missionId] (ProofSubmissionScreenV2),
// preserving its params.
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  Redirect: jest.fn(({ href }: { href: string | { pathname: string; params?: Record<string, string> } }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    const label = typeof href === 'string' ? href : `${href.pathname}?${JSON.stringify(href.params)}`;
    return <Text>{`redirect:${label}`}</Text>;
  }),
}));

describe('ProofSubmissionRoute (retired)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to Explore when missionId is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ missionId: undefined, proofRequirement: 'A photo.' });
    const { findByText } = await render(<ProofSubmissionRoute />);
    expect(await findByText('redirect:/explore')).toBeTruthy();
  });

  it('forwards missionId and proofRequirement to /proof/[missionId]', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ missionId: 'm-1', proofRequirement: 'A photo.' });
    const { findByText } = await render(<ProofSubmissionRoute />);
    expect(
      await findByText(`redirect:/proof/[missionId]?${JSON.stringify({ missionId: 'm-1', proofRequirement: 'A photo.' })}`),
    ).toBeTruthy();
  });
});
