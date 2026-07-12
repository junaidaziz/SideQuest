import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen, {
  computeXpProgress,
  formatStreakLabel,
  packCountLabel,
  whenPressed,
} from './HomeScreen';
import { getHome } from '../services/homeApi';
import type { HomeResponse, Mission } from '../types/api';

jest.mock('../services/homeApi');

const mockGetHome = getHome as jest.MockedFunction<typeof getHome>;

const DAILY_MISSION: Mission = {
  id: 'daily-1',
  category: 'create',
  title: 'Street Typography',
  desc: 'Find 5 different letterforms in your environment. Collect them into one photo.',
  full: 'Full brief.',
  proof: 'Photograph them.',
  time: '25 min',
  xp: '+45 XP',
  diff: 'Medium',
  dots: 2,
};

const HOME: HomeResponse = {
  level: { level: 4, xpIntoLevel: 620, xpToNextLevel: 380, totalXp: 620 },
  streak: { currentStreak: 3, longestStreak: 7 },
  dailyMission: DAILY_MISSION,
  pendingChallenges: [],
  savedPacks: [
    { name: 'Outdoors Solo', missionCount: 6 },
    { name: 'City Explorer', missionCount: 8 },
  ],
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof HomeScreen>> = {},
) {
  const onOpenProfile = jest.fn();
  const onSelectDailyMission = jest.fn();
  const onStartNewQuest = jest.fn();
  const onOpenPack = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <HomeScreen
        onOpenProfile={onOpenProfile}
        onSelectDailyMission={onSelectDailyMission}
        onStartNewQuest={onStartNewQuest}
        onOpenPack={onOpenPack}
        {...overrides}
      />
    </QueryClientProvider>,
  );
  return { onOpenProfile, onSelectDailyMission, onStartNewQuest, onOpenPack };
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
  });

  describe('rendering', () => {
    it('renders the wordmark and profile control immediately', async () => {
      await renderScreen();
      expect(screen.getByText('SideQuest')).toBeTruthy();
      expect(screen.getByLabelText('Open profile')).toBeTruthy();
      await waitFor(() => expect(mockGetHome).toHaveBeenCalled());
    });

    it('fetches the home aggregate once on mount', async () => {
      await renderScreen();
      await waitFor(() => expect(mockGetHome).toHaveBeenCalledTimes(1));
    });

    it('renders a loading skeleton before the response arrives', async () => {
      mockGetHome.mockReturnValue(new Promise(() => {})); // never resolves
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByLabelText('Loading your home feed')).toBeTruthy(),
      );
    });

    it('renders level, total XP and next-level label once loaded', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
      expect(screen.getByText('620 XP')).toBeTruthy();
      expect(screen.getByText('380 XP to Level 5')).toBeTruthy();
    });

    it('exposes the XP progress bar with the computed percentage', async () => {
      await renderScreen();
      // 620 / (620 + 380) = 62%
      const bar = await screen.findByLabelText('380 XP to level 5');
      expect(bar.props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 62,
        text: '620 XP earned, 380 to go',
      });
    });

    it('renders the streak value and prompt', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('3-day streak')).toBeTruthy());
      expect(
        screen.getByText('Complete a quest today to keep it going'),
      ).toBeTruthy();
    });

    it('renders the daily mission card when a curated pick exists', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Typography')).toBeTruthy());
      expect(screen.getByText("Today's free mission")).toBeTruthy();
      expect(screen.getByText('CREATE')).toBeTruthy();
      expect(screen.getByText('+45 XP')).toBeTruthy();
    });

    it('hides the daily mission card when the curated pool is empty', async () => {
      mockGetHome.mockResolvedValue({ ...HOME, dailyMission: null });
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
      expect(screen.queryByText("Today's free mission")).toBeNull();
    });

    it('always renders the pending-challenges empty state', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('No challenges yet')).toBeTruthy());
      expect(
        screen.getByText('Complete a quest and dare a friend to beat your time'),
      ).toBeTruthy();
    });

    it('renders saved pack cards with pluralised counts', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Outdoors Solo')).toBeTruthy());
      expect(screen.getByText('City Explorer')).toBeTruthy();
      expect(screen.getByText('6 missions')).toBeTruthy();
      expect(screen.getByText('8 missions')).toBeTruthy();
    });

    it('renders the saved-packs empty state when the user has none', async () => {
      mockGetHome.mockResolvedValue({ ...HOME, savedPacks: [] });
      await renderScreen();
      await waitFor(() => expect(screen.getByText('No saved packs yet')).toBeTruthy());
    });

    it('renders an error state when the request fails', async () => {
      mockGetHome.mockRejectedValue(new Error('Network request failed'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load home")).toBeTruthy());
    });
  });

  describe('interactions', () => {
    it('calls onOpenProfile when the profile button is pressed', async () => {
      const { onOpenProfile } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Open profile'));
      expect(onOpenProfile).toHaveBeenCalledTimes(1);
    });

    it('calls onSelectDailyMission with the mission id when the card is tapped', async () => {
      const { onSelectDailyMission } = await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Typography')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/View today's quest: Street Typography/));
      expect(onSelectDailyMission).toHaveBeenCalledWith('daily-1');
    });

    it('calls onStartNewQuest when the FAB is pressed', async () => {
      const { onStartNewQuest } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Start a new quest'));
      expect(onStartNewQuest).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenPack with the pack name when a pack card is tapped', async () => {
      const { onOpenPack } = await renderScreen();
      await waitFor(() => expect(screen.getByText('Outdoors Solo')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Outdoors Solo pack, 6 missions'));
      expect(onOpenPack).toHaveBeenCalledWith('Outdoors Solo');
    });

    it('retries the request when "Try again" is pressed after an error', async () => {
      mockGetHome.mockRejectedValueOnce(new Error('Network request failed'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load home")).toBeTruthy());

      mockGetHome.mockResolvedValueOnce(HOME);
      await fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Street Typography')).toBeTruthy());
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('exposes the wordmark as a header', async () => {
      await renderScreen();
      expect(screen.getByText('SideQuest').props.accessibilityRole).toBe('header');
      await waitFor(() => expect(mockGetHome).toHaveBeenCalled());
    });
  });

  describe('edge cases', () => {
    it('does not throw when the daily card is tapped without a handler', async () => {
      await renderScreen({ onSelectDailyMission: undefined });
      await waitFor(() => expect(screen.getByText('Street Typography')).toBeTruthy());
      expect(() =>
        fireEvent.press(screen.getByLabelText(/View today's quest: Street Typography/)),
      ).not.toThrow();
    });

    it('does not throw when the FAB is pressed without a handler', async () => {
      await renderScreen({ onStartNewQuest: undefined });
      expect(() => fireEvent.press(screen.getByLabelText('Start a new quest'))).not.toThrow();
    });
  });

  describe('computeXpProgress', () => {
    it('computes the fill percentage from the level split', () => {
      expect(
        computeXpProgress({ level: 4, xpIntoLevel: 620, xpToNextLevel: 380, totalXp: 620 }),
      ).toBe(62);
    });

    it('returns 0 when the level curve has no XP on either side', () => {
      expect(
        computeXpProgress({ level: 1, xpIntoLevel: 0, xpToNextLevel: 0, totalXp: 0 }),
      ).toBe(0);
    });

    it('returns 100 when the user is at the very top of a level', () => {
      expect(
        computeXpProgress({ level: 2, xpIntoLevel: 100, xpToNextLevel: 0, totalXp: 200 }),
      ).toBe(100);
    });

    it('returns 0 immediately after leveling up', () => {
      expect(
        computeXpProgress({ level: 3, xpIntoLevel: 0, xpToNextLevel: 100, totalXp: 200 }),
      ).toBe(0);
    });
  });

  describe('formatStreakLabel', () => {
    it('formats a positive streak', () => {
      expect(formatStreakLabel(3)).toBe('3-day streak');
    });

    it('formats a zero streak without special-casing', () => {
      expect(formatStreakLabel(0)).toBe('0-day streak');
    });
  });

  describe('packCountLabel', () => {
    it('pluralises multiple missions', () => {
      expect(packCountLabel(6)).toBe('6 missions');
    });

    it('uses the singular for exactly one mission', () => {
      expect(packCountLabel(1)).toBe('1 mission');
    });
  });

  describe('whenPressed style helper', () => {
    it('returns the style while pressed', () => {
      expect(whenPressed(true, { opacity: 0.5 })).toEqual({ opacity: 0.5 });
    });

    it('returns null while not pressed', () => {
      expect(whenPressed(false, { opacity: 0.5 })).toBeNull();
    });
  });
});
