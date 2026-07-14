import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import YouScreen, {
  displayNameOrFallback,
  initialsFromName,
  xpProgressPercent,
} from './YouScreen';
import { getHome } from '../../services/homeApi';
import type { HomeResponse, UserProfile } from '../../types/api';

jest.mock('../../services/homeApi');

const mockLogout = jest.fn<Promise<void>, []>();
let mockUser: UserProfile | null;

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: UserProfile | null; logout: typeof mockLogout }) => unknown) =>
    selector({ user: mockUser, logout: mockLogout }),
}));

const mockGetHome = getHome as jest.MockedFunction<typeof getHome>;

const SIGNED_IN: UserProfile = {
  id: 'u1',
  email: 'alex@example.com',
  displayName: 'Alex Rivera',
  isGuest: false,
  avatarUrl: null,
};

const GUEST: UserProfile = {
  id: 'g1',
  email: null,
  displayName: null,
  isGuest: true,
  avatarUrl: null,
};

const HOME: HomeResponse = {
  level: { level: 7, xpIntoLevel: 62, xpToNextLevel: 38, totalXp: 1250 },
  streak: { currentStreak: 3, longestStreak: 9 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [{ name: 'Outdoors', missionCount: 4 }],
  taskStats: { total: 30, approved: 28, pending: 1, rejected: 1, completionRate: 0.93 },
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof YouScreen>> = {},
) {
  const props = {
    onSettings: jest.fn(),
    onEditProfile: jest.fn(),
    onPaymentMethods: jest.fn(),
    onCreateAccount: jest.fn(),
    onLoginExisting: jest.fn(),
    onLoggedOut: jest.fn(),
    ...overrides,
  };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <YouScreen {...props} />
    </QueryClientProvider>,
  );
  return props;
}

describe('YouScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = SIGNED_IN;
    mockGetHome.mockResolvedValue(HOME);
    mockLogout.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('shows a loading skeleton while auth is still hydrating', async () => {
      mockUser = null;
      await renderScreen();
      expect(screen.getByText('Loading your profile')).toBeTruthy();
    });

    it('renders the signed-in identity and real level/XP data', async () => {
      await renderScreen();
      expect(screen.getByText('Alex Rivera')).toBeTruthy();
      await waitFor(() => expect(screen.getByText('Level 7')).toBeTruthy());
      expect(screen.getByText('1,250 XP · 38 to Level 8')).toBeTruthy();
    });

    it('renders real lifetime stats from the home query', async () => {
      await renderScreen();
      // The metric row and streak card each expose one combined announcement,
      // so the real numbers live in the accessibility label, not loose text.
      await waitFor(() =>
        expect(
          screen.getByLabelText(
            '28 quests completed, best streak 9 days, 1 saved packs',
          ),
        ).toBeTruthy(),
      );
      expect(
        screen.getByLabelText(
          'Current streak 3 days. Complete a quest today to keep it going.',
        ),
      ).toBeTruthy();
    });

    it('renders the guest banner and CTAs for a guest session', async () => {
      mockUser = GUEST;
      await renderScreen();
      expect(screen.getByText("You're browsing as a guest")).toBeTruthy();
      expect(screen.getByLabelText('Create an account')).toBeTruthy();
      expect(screen.getByLabelText('Log in to an existing account')).toBeTruthy();
    });

    it('falls back to the email under the name while the home query is loading', async () => {
      let resolve: (v: HomeResponse) => void = () => {};
      mockGetHome.mockImplementation(
        () => new Promise<HomeResponse>((r) => { resolve = r; }),
      );
      await renderScreen();
      // Data not yet resolved → identity block shows the email fallback.
      expect(screen.getByText('alex@example.com')).toBeTruthy();
      resolve(HOME);
    });

    it('renders an error state with retry when the home query fails', async () => {
      mockGetHome.mockRejectedValue(new Error('network'));
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText("Couldn't load your progress")).toBeTruthy(),
      );
      expect(screen.getByLabelText('Try again')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('navigates to settings from the gear', async () => {
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Settings'));
      expect(props.onSettings).toHaveBeenCalledTimes(1);
    });

    it('navigates to edit profile', async () => {
      const props = await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 7')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Edit profile'));
      expect(props.onEditProfile).toHaveBeenCalledTimes(1);
    });

    it('navigates to payment methods', async () => {
      const props = await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 7')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Payment methods'));
      expect(props.onPaymentMethods).toHaveBeenCalledTimes(1);
    });

    it('fires the guest create-account CTA', async () => {
      mockUser = GUEST;
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Create an account'));
      expect(props.onCreateAccount).toHaveBeenCalledTimes(1);
    });

    it('fires the guest login CTA', async () => {
      mockUser = GUEST;
      const props = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Log in to an existing account'));
      expect(props.onLoginExisting).toHaveBeenCalledTimes(1);
    });

    it('retries the home query from the error state', async () => {
      mockGetHome.mockRejectedValueOnce(new Error('network'));
      mockGetHome.mockResolvedValueOnce(HOME);
      await renderScreen();
      await waitFor(() => expect(screen.getByLabelText('Try again')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByText('Level 7')).toBeTruthy());
    });
  });

  describe('logout flow', () => {
    it('opens the confirm dialog and logs out', async () => {
      const props = await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 7')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Log out'));
      await waitFor(() =>
        expect(screen.getByText('Log out of this account?')).toBeTruthy(),
      );
      await fireEvent.press(screen.getByLabelText('Log out of this account'));
      await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
      expect(props.onLoggedOut).toHaveBeenCalledTimes(1);
    });

    it('keeps the dialog open when logout fails locally', async () => {
      mockLogout.mockRejectedValueOnce(new Error('secure store'));
      const props = await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 7')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Log out'));
      await waitFor(() =>
        expect(screen.getByLabelText('Log out of this account')).toBeTruthy(),
      );
      await fireEvent.press(screen.getByLabelText('Log out of this account'));
      await waitFor(() => expect(mockLogout).toHaveBeenCalled());
      expect(props.onLoggedOut).not.toHaveBeenCalled();
      expect(screen.getByText('Log out of this account?')).toBeTruthy();
    });

    it('dismisses the dialog via the backdrop', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 7')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Log out'));
      await waitFor(() =>
        expect(screen.getByText('Log out of this account?')).toBeTruthy(),
      );
      await fireEvent.press(
        screen.getByTestId('logout-backdrop', { includeHiddenElements: true }),
      );
      await waitFor(() =>
        expect(screen.queryByText('Log out of this account?')).toBeNull(),
      );
    });

    it('dismisses the dialog via Stay logged in', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 7')).toBeTruthy());
      await fireEvent.press(screen.getByLabelText('Log out'));
      await waitFor(() =>
        expect(screen.getByLabelText('Stay logged in')).toBeTruthy(),
      );
      await fireEvent.press(screen.getByLabelText('Stay logged in'));
      await waitFor(() =>
        expect(screen.queryByText('Log out of this account?')).toBeNull(),
      );
    });
  });

  describe('pure helpers', () => {
    it('initialsFromName handles two-word, single-word, email and empty', () => {
      expect(initialsFromName('Alex Rivera', null)).toBe('AR');
      expect(initialsFromName('Alex', null)).toBe('AL');
      expect(initialsFromName(null, 'sam@x.com')).toBe('SA');
      expect(initialsFromName(null, null)).toBe('?');
    });

    it('displayNameOrFallback prefers name then email then Explorer', () => {
      expect(displayNameOrFallback('Alex', 'a@b.com')).toBe('Alex');
      expect(displayNameOrFallback('  ', 'a@b.com')).toBe('a@b.com');
      expect(displayNameOrFallback(null, null)).toBe('Explorer');
    });

    it('xpProgressPercent computes a rounded percentage and guards zero', () => {
      expect(xpProgressPercent({ level: 1, xpIntoLevel: 62, xpToNextLevel: 38, totalXp: 62 })).toBe(62);
      expect(xpProgressPercent({ level: 1, xpIntoLevel: 0, xpToNextLevel: 0, totalXp: 0 })).toBe(0);
    });
  });
});
