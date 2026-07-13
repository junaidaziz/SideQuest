import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileScreen, {
  displayNameOrFallback,
  initialsFromName,
} from './ProfileScreen';
import { getHome } from '../../services/homeApi';
import type { HomeResponse, UserProfile } from '../../types/api';

jest.mock('../../services/homeApi');

/**
 * ProfileScreen reads `user` and `logout` from the auth store via selectors.
 * We mock the store the same way the other screen tests do — handing back a
 * controllable state object so the guest/signed-in split and the logout flow
 * can be exercised without token persistence or native secure-store.
 */
const mockLogout = jest.fn<Promise<void>, []>();
let mockUser: UserProfile | null;

interface MockAuthState {
  user: UserProfile | null;
  logout: typeof mockLogout;
}

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: MockAuthState) => unknown) =>
    selector({ user: mockUser, logout: mockLogout }),
}));

const mockGetHome = getHome as jest.MockedFunction<typeof getHome>;

const GUEST_USER: UserProfile = {
  id: 'guest-1',
  email: null,
  displayName: null,
  isGuest: true,
};

const SIGNED_IN_USER: UserProfile = {
  id: 'user-1',
  email: 'jordan.ellis@example.com',
  displayName: 'Jordan Ellis',
  isGuest: false,
};

const HOME: HomeResponse = {
  level: { level: 4, xpIntoLevel: 620, xpToNextLevel: 380, totalXp: 620 },
  streak: { currentStreak: 3, longestStreak: 7 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof ProfileScreen>> = {},
) {
  const onBack = jest.fn();
  const onCreateAccount = jest.fn();
  const onLoginExisting = jest.fn();
  const onLoggedOut = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ProfileScreen
        onBack={onBack}
        onCreateAccount={onCreateAccount}
        onLoginExisting={onLoginExisting}
        onLoggedOut={onLoggedOut}
        {...overrides}
      />
    </QueryClientProvider>,
  );
  return { onBack, onCreateAccount, onLoginExisting, onLoggedOut };
}

async function openLogoutDialog(): Promise<void> {
  await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('Log out'));
  await waitFor(() =>
    expect(screen.getByText('Log out of this account?')).toBeTruthy(),
  );
}

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHome.mockResolvedValue(HOME);
    mockLogout.mockResolvedValue();
    mockUser = GUEST_USER;
  });

  describe('rendering — guest state', () => {
    it('renders the guest banner framing', async () => {
      await renderScreen();
      expect(screen.getByText("You're browsing as a guest")).toBeTruthy();
    });

    it('renders both guest CTAs and the reassurance footnote', async () => {
      await renderScreen();
      expect(screen.getByLabelText('Create an account')).toBeTruthy();
      expect(
        screen.getByLabelText('Log in to an existing account'),
      ).toBeTruthy();
      expect(
        screen.getByText(
          'Creating an account keeps this exact progress — nothing resets.',
        ),
      ).toBeTruthy();
    });

    it('renders the level and streak cards from the home query', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
      expect(screen.getByText('620 XP')).toBeTruthy();
      expect(screen.getByText('380 XP to Level 5')).toBeTruthy();
      expect(screen.getByText('3-day streak')).toBeTruthy();
    });

    it('does not render a logout button for a guest', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
      expect(screen.queryByLabelText('Log out')).toBeNull();
    });
  });

  describe('rendering — signed-in state', () => {
    beforeEach(() => {
      mockUser = SIGNED_IN_USER;
    });

    it('renders the display name and email', async () => {
      await renderScreen();
      expect(screen.getByText('Jordan Ellis')).toBeTruthy();
      expect(screen.getByText('jordan.ellis@example.com')).toBeTruthy();
    });

    it('renders the progress-synced badge', async () => {
      await renderScreen();
      expect(screen.getByText('✓ Progress synced')).toBeTruthy();
      // The "JE" avatar initials sit in an accessibility-hidden subtree; the
      // derivation itself is verified directly via the initialsFromName suite.
    });

    it('renders the logout button and hides the guest CTAs', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
      expect(screen.getByLabelText('Log out')).toBeTruthy();
      expect(screen.queryByLabelText('Create an account')).toBeNull();
    });
  });

  describe('rendering — loading and error', () => {
    it('renders a full skeleton while auth is still hydrating', async () => {
      mockUser = null;
      await renderScreen();
      expect(screen.getByLabelText('Loading your profile')).toBeTruthy();
    });

    it('renders a progress skeleton while the home query is in flight', async () => {
      mockGetHome.mockReturnValue(new Promise(() => {})); // never resolves
      await renderScreen();
      await waitFor(() =>
        expect(
          screen.getByLabelText('Loading your level and streak'),
        ).toBeTruthy(),
      );
    });

    it('renders an inline error state when the home query fails', async () => {
      mockGetHome.mockRejectedValue(new Error('Network request failed'));
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText("Couldn't load progress")).toBeTruthy(),
      );
    });

    it('still renders the identity and actions when home data has not loaded', async () => {
      mockUser = SIGNED_IN_USER;
      mockGetHome.mockReturnValue(new Promise(() => {})); // never resolves
      await renderScreen();
      // Identity + logout come from the auth store, independent of the query.
      expect(screen.getByText('Jordan Ellis')).toBeTruthy();
      expect(screen.getByLabelText('Log out')).toBeTruthy();
    });
  });

  describe('interactions — navigation callbacks', () => {
    it('calls onBack when the back button is pressed', async () => {
      const { onBack } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Back to home'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onCreateAccount when the primary CTA is pressed', async () => {
      const { onCreateAccount } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Create an account'));
      expect(onCreateAccount).toHaveBeenCalledTimes(1);
    });

    it('calls onLoginExisting when the secondary CTA is pressed', async () => {
      const { onLoginExisting } = await renderScreen();
      await fireEvent.press(
        screen.getByLabelText('Log in to an existing account'),
      );
      expect(onLoginExisting).toHaveBeenCalledTimes(1);
    });

    it('retries the home query when "Try again" is pressed after an error', async () => {
      mockGetHome.mockRejectedValueOnce(new Error('Network request failed'));
      await renderScreen();
      await waitFor(() =>
        expect(screen.getByText("Couldn't load progress")).toBeTruthy(),
      );
      mockGetHome.mockResolvedValueOnce(HOME);
      await fireEvent.press(screen.getByLabelText('Try again'));
      await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
    });
  });

  describe('interactions — logout confirm flow', () => {
    beforeEach(() => {
      mockUser = SIGNED_IN_USER;
    });

    it('opens the confirmation dialog with honest logout copy', async () => {
      await renderScreen();
      await openLogoutDialog();
      expect(
        screen.getByText(/back to a fresh guest session on this device/),
      ).toBeTruthy();
      expect(screen.getByText(/Your account isn't deleted/)).toBeTruthy();
    });

    it('logs out and fires onLoggedOut when logout is confirmed', async () => {
      const { onLoggedOut } = await renderScreen();
      await openLogoutDialog();
      await fireEvent.press(screen.getByLabelText('Log out of this account'));
      await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
      expect(onLoggedOut).toHaveBeenCalledTimes(1);
    });

    it('closes the dialog without logging out when cancel is pressed', async () => {
      const { onLoggedOut } = await renderScreen();
      await openLogoutDialog();
      await fireEvent.press(screen.getByLabelText('Stay logged in'));
      await waitFor(() =>
        expect(screen.queryByText('Log out of this account?')).toBeNull(),
      );
      expect(mockLogout).not.toHaveBeenCalled();
      expect(onLoggedOut).not.toHaveBeenCalled();
    });

    it('dismisses the dialog when the backdrop is pressed', async () => {
      await renderScreen();
      await openLogoutDialog();
      // The backdrop is intentionally gated from assistive tech by the sheet's
      // accessibilityViewIsModal, so it is only reachable with hidden elements.
      await fireEvent.press(
        screen.getByTestId('logout-backdrop', { includeHiddenElements: true }),
      );
      await waitFor(() =>
        expect(screen.queryByText('Log out of this account?')).toBeNull(),
      );
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it('keeps the dialog open and does not navigate if logout rejects', async () => {
      mockLogout.mockRejectedValueOnce(new Error('clearTokens failed'));
      const { onLoggedOut } = await renderScreen();
      await openLogoutDialog();
      await fireEvent.press(screen.getByLabelText('Log out of this account'));
      await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
      // Logout failed, so the user is not told they logged out: the dialog
      // stays open and navigation is not triggered.
      expect(screen.getByText('Log out of this account?')).toBeTruthy();
      expect(onLoggedOut).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('gives every interactive element a button role and a label (guest)', async () => {
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('exposes the XP progress bar with the computed percentage', async () => {
      await renderScreen();
      const bar = await screen.findByLabelText('380 XP to level 5');
      expect(bar.props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 62,
        text: '620 XP earned, 380 to go',
      });
    });

    it('exposes the header title as a header', async () => {
      await renderScreen();
      expect(screen.getByText('Profile').props.accessibilityRole).toBe(
        'header',
      );
    });

    it('marks the confirm dialog title as a header', async () => {
      mockUser = SIGNED_IN_USER;
      await renderScreen();
      await openLogoutDialog();
      expect(
        screen.getByText('Log out of this account?').props.accessibilityRole,
      ).toBe('header');
    });
  });

  describe('edge cases', () => {
    it('does not throw when the back button is pressed without a handler', async () => {
      await renderScreen({ onBack: undefined });
      expect(() =>
        fireEvent.press(screen.getByLabelText('Back to home')),
      ).not.toThrow();
    });

    it('does not throw when create-account is pressed without a handler', async () => {
      await renderScreen({ onCreateAccount: undefined });
      expect(() =>
        fireEvent.press(screen.getByLabelText('Create an account')),
      ).not.toThrow();
    });

    it('logs out cleanly when home data has not loaded yet', async () => {
      mockUser = SIGNED_IN_USER;
      mockGetHome.mockReturnValue(new Promise(() => {})); // never resolves
      const { onLoggedOut } = await renderScreen();
      await fireEvent.press(screen.getByLabelText('Log out'));
      await waitFor(() =>
        expect(screen.getByText('Log out of this account?')).toBeTruthy(),
      );
      await fireEvent.press(screen.getByLabelText('Log out of this account'));
      await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
      expect(onLoggedOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('initialsFromName', () => {
    it('uses the first letter of the first two name parts', () => {
      expect(initialsFromName('Jordan Ellis', null)).toBe('JE');
    });

    it('falls back to the first two letters of a single-word name', () => {
      expect(initialsFromName('Jordan', null)).toBe('JO');
    });

    it('falls back to the email local-part when the name is null', () => {
      expect(initialsFromName(null, 'sam@example.com')).toBe('SA');
    });

    it('returns a neutral glyph when both name and email are empty', () => {
      expect(initialsFromName(null, null)).toBe('?');
      expect(initialsFromName('   ', '')).toBe('?');
    });
  });

  describe('displayNameOrFallback', () => {
    it('prefers a non-empty display name', () => {
      expect(displayNameOrFallback('Jordan Ellis', 'x@y.com')).toBe(
        'Jordan Ellis',
      );
    });

    it('falls back to the email when the name is blank', () => {
      expect(displayNameOrFallback('  ', 'x@y.com')).toBe('x@y.com');
    });

    it('falls back to Explorer when both are missing', () => {
      expect(displayNameOrFallback(null, null)).toBe('Explorer');
    });
  });
});
