import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ExploreScreen, {
  EXPLORE_MODES,
  EXPLORE_SHELVES,
  countSavedQuests,
  savedCountLabel,
} from './ExploreScreen';
import { getHome } from '../../services/homeApi';
import type { HomeResponse } from '../../types/api';

jest.mock('react-native-reanimated', () => {
  const R = require('react');
  const { View, Text, ScrollView } = require('react-native');
  const pass = (Comp: unknown) =>
    R.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      const { entering, exiting, layout, ...rest } = props;
      return R.createElement(Comp, { ...rest, ref });
    });
  const chain = (): unknown =>
    new Proxy(function () {}, { get: () => chain(), apply: () => chain() });
  return {
    __esModule: true,
    default: { View: pass(View), Text: pass(Text), ScrollView: pass(ScrollView), createAnimatedComponent: pass },
    FadeInDown: chain(),
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (fn: () => unknown) => (typeof fn === 'function' ? fn() : {}),
    withSpring: (v: unknown) => v,
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

jest.mock('../../services/homeApi');

const mockGetHome = getHome as jest.Mock;

const HOME: HomeResponse = {
  level: { level: 1, xpIntoLevel: 0, xpToNextLevel: 100, totalXp: 0 },
  streak: { currentStreak: 0, longestStreak: 0 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [
    { name: 'Outdoors Solo', missionCount: 4 },
    { name: 'Rainy Day', missionCount: 2 },
  ],
  taskStats: { total: 0, approved: 0, pending: 0, rejected: 0, completionRate: 0 },
};

async function renderScreen(overrides: Partial<React.ComponentProps<typeof ExploreScreen>> = {}) {
  const props = {
    onSearch: jest.fn(),
    onEditContext: jest.fn(),
    onSelectMode: jest.fn(),
    onSeeAll: jest.fn(),
    onOpenQuest: jest.fn(),
    onOpenSaved: jest.fn(),
    ...overrides,
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = await render(
    <QueryClientProvider client={queryClient}>
      <ExploreScreen {...props} />
    </QueryClientProvider>,
  );
  return { ...props, ...result };
}

describe('ExploreScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders the header, search, mode grid and shelves once loaded', async () => {
      await renderScreen();
      expect(screen.getByRole('header', { name: 'Explore' })).toBeTruthy();
      await waitFor(() => expect(screen.getByLabelText(/Search quests/)).toBeTruthy());
      EXPLORE_MODES.forEach((mode) => {
        expect(screen.getByLabelText(`${mode.name} quests`)).toBeTruthy();
      });
      EXPLORE_SHELVES.forEach((shelf) => {
        expect(screen.getByText(shelf.title)).toBeTruthy();
      });
    });

    it('renders the loading skeleton before data arrives', async () => {
      mockGetHome.mockReturnValue(new Promise(() => {}));
      await renderScreen();
      expect(screen.getByLabelText('Loading Explore')).toBeTruthy();
    });

    it('renders the error state when the request fails', async () => {
      mockGetHome.mockRejectedValue(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load Explore")).toBeTruthy());
    });

    it('shows the summed saved-quest count', async () => {
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByLabelText('Open your saved quests, 6 saved')).toBeTruthy(),
      );
    });

    it('shows a zero saved count when there are no saved packs (empty state)', async () => {
      mockGetHome.mockResolvedValue({ ...HOME, savedPacks: [] });
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByLabelText('Open your saved quests, 0 saved')).toBeTruthy(),
      );
    });

    it('uses the supplied context summary', async () => {
      await renderScreen({ contextSummary: 'Make · 15 min · indoors · free' });
      await waitFor(() => expect(screen.getByText('Make · 15 min · indoors · free')).toBeTruthy());
    });
  });

  describe('interactions', () => {
    it('calls onSearch and onEditContext', async () => {
      const { onSearch, onEditContext } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Search quests/)).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/Search quests/));
      await fireEvent.press(screen.getByLabelText('Edit your moment'));
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onEditContext).toHaveBeenCalledTimes(1);
    });

    it('calls onSelectMode with the tapped mode id and runs press-scale', async () => {
      const { onSelectMode } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Get out quests')).toBeTruthy());
      const tile = screen.getByLabelText('Get out quests');
      await fireEvent(tile, 'pressIn');
      await fireEvent(tile, 'pressOut');
      await fireEvent.press(tile);
      expect(onSelectMode).toHaveBeenCalledWith('get-out');
    });

    it('calls onOpenQuest from a shelf mini card', async () => {
      const { onOpenQuest } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Street Type Safari/)).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/Street Type Safari/));
      expect(onOpenQuest).toHaveBeenCalledWith('o-1');
    });

    it('calls onSeeAll with the shelf id', async () => {
      const { onSeeAll } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('See all Quick wins quests')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('See all Quick wins quests'));
      expect(onSeeAll).toHaveBeenCalledWith('quick-wins');
    });

    it('calls onOpenSaved from the saved-for-later row', async () => {
      const { onOpenSaved } = await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Open your saved quests/)).toBeTruthy());
      await fireEvent.press(screen.getByLabelText(/Open your saved quests/));
      expect(onOpenSaved).toHaveBeenCalledTimes(1);
    });

    it('retries the query when Try again is pressed', async () => {
      mockGetHome.mockRejectedValueOnce(new Error('offline'));
      await renderScreen();
      await waitFor(() => expect(screen.getByText("Couldn't load Explore")).toBeTruthy());
      mockGetHome.mockResolvedValueOnce(HOME);
      await fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByLabelText(/Search quests/)).toBeTruthy());
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText(/Search quests/)).toBeTruthy());
      screen.getAllByRole('button').forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });
  });

  describe('pure helpers', () => {
    it('countSavedQuests sums missionCount across packs', () => {
      expect(countSavedQuests(HOME.savedPacks)).toBe(6);
      expect(countSavedQuests([])).toBe(0);
    });

    it('savedCountLabel pluralises correctly', () => {
      expect(savedCountLabel(0)).toBe('0 quests you bookmarked');
      expect(savedCountLabel(1)).toBe('1 quest you bookmarked');
      expect(savedCountLabel(6)).toBe('6 quests you bookmarked');
    });
  });

  describe('Halcyon+ identity tints', () => {
    const VALID_IDENTITIES = ['community', 'streak', 'achievement', 'xp'];

    it('every mode tile carries a valid gamification identity (not a hardcoded hex)', () => {
      EXPLORE_MODES.forEach((mode) => {
        expect(VALID_IDENTITIES).toContain(mode.identity);
        // Guard against a regression back to the old hardcoded gradient pair.
        expect((mode as unknown as { colors?: unknown }).colors).toBeUndefined();
      });
    });

    it('every shelf item carries a valid identity instead of a hardcoded art rgba', () => {
      EXPLORE_SHELVES.flatMap((shelf) => shelf.items).forEach((item) => {
        expect(VALID_IDENTITIES).toContain(item.identity);
        expect((item as unknown as { art?: unknown }).art).toBeUndefined();
      });
    });
  });
});
