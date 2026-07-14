import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import XpDetailRoute from '../../app/progress/xp';
import LevelDetailRoute from '../../app/progress/level';
import StreakDetailRoute from '../../app/progress/streak';
import StatisticsRoute from '../../app/statistics';
import CommunityRoute from '../../app/community';
import LeaderboardsRoute from '../../app/leaderboards';
import RewardsRoute from '../../app/rewards';
import AchievementsRoute from '../../app/achievements/index';
import AchievementDetailRoute from '../../app/achievements/[id]';
import VerificationDetailRoute from '../../app/verification/[completionId]';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ id: 'ach-1' })),
  Redirect: jest.fn(({ href }: { href: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  }),
}));
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { displayName: string } }) => unknown) => selector({ user: { displayName: 'Ada' } }),
}));

function mockBackOnly(label = 'onBack') {
  return jest.fn(({ onBack }: { onBack: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onBack}><Text>{label}</Text></Pressable>;
  });
}

jest.mock('../../src/screens/XpDetailScreen', () => mockBackOnly());
jest.mock('../../src/screens/LevelDetailScreen', () => mockBackOnly());
jest.mock('../../src/screens/StatisticsScreen', () => mockBackOnly());
jest.mock('../../src/screens/VerificationDetailScreen', () => mockBackOnly());
jest.mock('../../src/screens/StreakDetailScreen', () =>
  jest.fn(({ onBack, onFindQuest }: { onBack: () => void; onFindQuest: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="find" onPress={onFindQuest}><Text>f</Text></Pressable>
      </>
    );
  }),
);
jest.mock('../../src/screens/CommunityScreen', () =>
  jest.fn(({ onBack, onOpenQuest }: { onBack: () => void; onOpenQuest: (id: string) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="quest" onPress={() => onOpenQuest('q-9')}><Text>q</Text></Pressable>
      </>
    );
  }),
);
jest.mock('../../src/screens/LeaderboardsScreen', () => mockBackOnly());
jest.mock('../../src/screens/RewardsScreen', () =>
  jest.fn(({ onBack, onShareInvite }: { onBack: () => void; onShareInvite: (u: string) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="share" onPress={() => onShareInvite('https://sq/i')}><Text>s</Text></Pressable>
      </>
    );
  }),
);
jest.mock('../../src/screens/AchievementsScreen', () =>
  jest.fn(({ onBack, onOpenAchievement }: { onBack: () => void; onOpenAchievement: (id: string) => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="open" onPress={() => onOpenAchievement('ach-2')}><Text>o</Text></Pressable>
      </>
    );
  }),
);
jest.mock('../../src/screens/AchievementDetailScreen', () =>
  jest.fn(({ achievementId, onBack }: { achievementId: string; onBack: () => void }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pressable, Text } = require('react-native');
    return (
      <>
        <Text>{`id:${achievementId}`}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="onBack" onPress={onBack}><Text>b</Text></Pressable>
      </>
    );
  }),
);

describe('simple back-only detail routes', () => {
  beforeEach(() => jest.clearAllMocks());
  it.each([
    ['xp', XpDetailRoute],
    ['level', LevelDetailRoute],
    ['statistics', StatisticsRoute],
    ['leaderboards', LeaderboardsRoute],
    ['verification', VerificationDetailRoute],
  ])('%s goes back', async (_name, Route) => {
    const { getByLabelText } = await render(<Route />);
    await fireEvent.press(getByLabelText('onBack'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });
});

describe('StreakDetailRoute', () => {
  beforeEach(() => jest.clearAllMocks());
  it('finds a quest via Explore', async () => {
    const { getByLabelText } = await render(<StreakDetailRoute />);
    await fireEvent.press(getByLabelText('find'));
    expect(router.push).toHaveBeenCalledWith('/explore');
  });
});

describe('CommunityRoute', () => {
  beforeEach(() => jest.clearAllMocks());
  it('opens a quest by id', async () => {
    const { getByLabelText } = await render(<CommunityRoute />);
    await fireEvent.press(getByLabelText('quest'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'q-9' } });
  });
});

describe('RewardsRoute', () => {
  beforeEach(() => jest.clearAllMocks());
  it('shares the invite link via the OS share sheet', async () => {
    const spy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
    const { getByLabelText } = await render(<RewardsRoute />);
    await fireEvent.press(getByLabelText('share'));
    expect(spy).toHaveBeenCalledWith({ message: 'https://sq/i' });
  });
});

describe('Achievements routes', () => {
  beforeEach(() => jest.clearAllMocks());
  it('opens a single achievement from the grid', async () => {
    const { getByLabelText } = await render(<AchievementsRoute />);
    await fireEvent.press(getByLabelText('open'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/achievements/[id]', params: { id: 'ach-2' } });
  });

  it('passes the id param to the detail screen', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'ach-7' });
    const { findByText } = await render(<AchievementDetailRoute />);
    expect(await findByText('id:ach-7')).toBeTruthy();
  });

  it('redirects to the grid when the id param is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: undefined });
    const { findByText } = await render(<AchievementDetailRoute />);
    expect(await findByText('redirect:/achievements')).toBeTruthy();
  });
});
