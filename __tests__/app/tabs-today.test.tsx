import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import TodayTab from '../../app/(tabs)/today';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../src/store/authStore');
jest.mock('../../src/screens/TodayScreen', () =>
  jest.fn(
    ({
      onGetInspired,
      onOpenExplore,
      onOpenProfile,
      onOpenPendingProof,
    }: Record<string, () => void>) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      const btn = (label: string, onPress: () => void) => (
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
          <Text>{label}</Text>
        </Pressable>
      );
      return (
        <>
          {btn('inspire', onGetInspired)}
          {btn('explore', onOpenExplore)}
          {btn('profile', onOpenProfile)}
          {btn('pending', onOpenPendingProof)}
        </>
      );
    },
  ),
);

describe('TodayTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ user: { displayName: 'Ada' } }),
    );
  });

  it.each([
    ['inspire', '/explore'],
    ['explore', '/explore'],
    ['profile', '/you'],
  ])('routes %s to %s', async (label, target) => {
    const { getByLabelText } = await render(<TodayTab />);
    await fireEvent.press(getByLabelText(label));
    expect(router.push).toHaveBeenCalledWith(target);
  });

  it('opens the pending-proof verification detail', async () => {
    const { getByLabelText } = await render(<TodayTab />);
    await fireEvent.press(getByLabelText('pending'));
    expect(router.push).toHaveBeenCalledWith('/verification/pending');
  });
});
