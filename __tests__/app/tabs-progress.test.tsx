import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import ProgressTab from '../../app/(tabs)/progress';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../src/screens/ProgressOverviewScreen', () =>
  jest.fn(
    ({
      onOpenLevelDetail,
      onOpenXpDetail,
      onOpenStreakDetail,
      onOpenAchievements,
      onOpenAchievement,
      onOpenStatistics,
    }: Record<string, (id?: string) => void>) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pressable, Text } = require('react-native');
      const btn = (label: string, onPress: () => void) => (
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
          <Text>{label}</Text>
        </Pressable>
      );
      return (
        <>
          {btn('level', onOpenLevelDetail)}
          {btn('xp', onOpenXpDetail)}
          {btn('streak', onOpenStreakDetail)}
          {btn('achievements', onOpenAchievements)}
          {btn('achievement', () => onOpenAchievement('first-quest'))}
          {btn('statistics', onOpenStatistics)}
        </>
      );
    },
  ),
);

describe('ProgressTab', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['level', '/progress/level'],
    ['xp', '/progress/xp'],
    ['streak', '/progress/streak'],
    ['achievements', '/achievements'],
    ['statistics', '/statistics'],
  ])('routes %s to %s', async (label, target) => {
    const { getByLabelText } = await render(<ProgressTab />);
    await fireEvent.press(getByLabelText(label));
    expect(router.push).toHaveBeenCalledWith(target);
  });

  it('opens a single achievement by id', async () => {
    const { getByLabelText } = await render(<ProgressTab />);
    await fireEvent.press(getByLabelText('achievement'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/achievements/[id]', params: { id: 'first-quest' } });
  });
});
