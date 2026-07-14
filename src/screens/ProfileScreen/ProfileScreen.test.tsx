import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import ProfileScreen, {
  displayNameOrFallback,
  initialsFromName,
  validateDisplayName,
} from './ProfileScreen';
import { getHome } from '../../services/homeApi';
import { updateDisplayName } from '../../services/profileApi';
import { removeAvatar, uploadAvatar } from '../../services/avatarApi';
import type { HomeResponse, UserProfile } from '../../types/api';

jest.mock('../../services/homeApi');
jest.mock('../../services/profileApi');
jest.mock('../../services/avatarApi');
jest.mock('expo-image-picker');

/**
 * ProfileScreen reads `user`, `logout` and `updateProfile` from the auth store
 * via selectors. We mock the store the same way the other screen tests do —
 * handing back a controllable state object so the guest/signed-in split, the
 * logout flow, and profile edits can be exercised without token persistence or
 * native secure-store. `updateProfile` is a plain spy — we assert it is called
 * with the freshly-fetched profile (the store's re-render behaviour belongs to
 * the authStore unit tests, and mutating shared module state here would leak
 * across tests when async mutation callbacks land after a test completes).
 */
const mockLogout = jest.fn<Promise<void>, []>();
const mockUpdateProfile = jest.fn<void, [UserProfile]>();
let mockUser: UserProfile | null;

interface MockAuthState {
  user: UserProfile | null;
  logout: typeof mockLogout;
  updateProfile: typeof mockUpdateProfile;
}

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (s: MockAuthState) => unknown) =>
    selector({
      user: mockUser,
      logout: mockLogout,
      updateProfile: mockUpdateProfile,
    }),
}));

const mockGetHome = getHome as jest.MockedFunction<typeof getHome>;
const mockUpdateDisplayName = updateDisplayName as jest.MockedFunction<
  typeof updateDisplayName
>;
const mockUploadAvatar = uploadAvatar as jest.MockedFunction<typeof uploadAvatar>;
const mockRemoveAvatar = removeAvatar as jest.MockedFunction<typeof removeAvatar>;
const mockRequestCamera =
  ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const mockRequestLibrary =
  ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

const GUEST_USER: UserProfile = {
  id: 'guest-1',
  email: null,
  displayName: null,
  isGuest: true,
  avatarUrl: null,
};

const SIGNED_IN_USER: UserProfile = {
  id: 'user-1',
  email: 'jordan.ellis@example.com',
  displayName: 'Jordan Ellis',
  isGuest: false,
  avatarUrl: null,
};

const SIGNED_IN_WITH_AVATAR: UserProfile = {
  ...SIGNED_IN_USER,
  avatarUrl: 'https://s3.example.test/avatar.jpg?sig=abc',
};

function grantedPermission() {
  return { granted: true, status: 'granted' as const };
}

function deniedPermission() {
  return { granted: false, status: 'denied' as const };
}

function pickedAsset(uri = 'file:///tmp/new-avatar.jpg') {
  return { canceled: false, assets: [{ uri }] };
}

const HOME: HomeResponse = {
  level: { level: 4, xpIntoLevel: 620, xpToNextLevel: 380, totalXp: 620 },
  streak: { currentStreak: 3, longestStreak: 7 },
  dailyMission: null,
  pendingChallenges: [],
  savedPacks: [],
  taskStats: { total: 0, approved: 0, pending: 0, rejected: 0, completionRate: 0 },
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof ProfileScreen>> = {},
) {
  const onBack = jest.fn();
  const onCreateAccount = jest.fn();
  const onLoginExisting = jest.fn();
  const onLoggedOut = jest.fn();
  const onPaymentMethods = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: {
      // gcTime: 0 evicts cache entries as soon as they go unused, so no
      // 5-minute garbage-collection timer lingers past a test and keeps the
      // Jest worker alive (or leaks into the next test's act scope).
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ProfileScreen
        onBack={onBack}
        onCreateAccount={onCreateAccount}
        onLoginExisting={onLoginExisting}
        onLoggedOut={onLoggedOut}
        onPaymentMethods={onPaymentMethods}
        {...overrides}
      />
    </QueryClientProvider>,
  );
  return {
    onBack,
    onCreateAccount,
    onLoginExisting,
    onLoggedOut,
    onPaymentMethods,
  };
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
    mockUpdateDisplayName.mockResolvedValue({
      ...SIGNED_IN_USER,
      displayName: 'Jordan Rivera',
    });
    mockUploadAvatar.mockResolvedValue(SIGNED_IN_WITH_AVATAR);
    mockRemoveAvatar.mockResolvedValue(SIGNED_IN_USER);
    mockRequestCamera.mockResolvedValue(grantedPermission());
    mockRequestLibrary.mockResolvedValue(grantedPermission());
    mockLaunchCamera.mockResolvedValue(pickedAsset());
    mockLaunchLibrary.mockResolvedValue(pickedAsset('file:///tmp/lib.png'));
    mockUser = GUEST_USER;
  });

  /**
   * Renders in a signed-in state and waits for the background `home` query to
   * settle before returning. Flushing the query here keeps its resolution
   * inside an act()-wrapped waitFor — otherwise it lands after the test ends,
   * producing "not wrapped in act" warnings and a leaked react-query notify
   * timer that force-exits the worker.
   */
  async function renderSignedIn(
    user: UserProfile = SIGNED_IN_USER,
    overrides: Partial<React.ComponentProps<typeof ProfileScreen>> = {},
  ) {
    mockUser = user;
    const handles = await renderScreen(overrides);
    await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
    return handles;
  }

  /** Fires the avatar tap, then invokes the Nth Alert action's onPress. */
  async function avatarActionVia(actionIndex: number, label: string) {
    const alertSpy = jest.spyOn(Alert, 'alert');
    await fireEvent.press(screen.getByLabelText(label));
    const buttons = alertSpy.mock.calls[0]?.[2];
    const action = buttons?.[actionIndex];
    await action?.onPress?.();
    alertSpy.mockRestore();
  }

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

    it('renders the lifetime-stats row from data already in the /home response', async () => {
      mockGetHome.mockResolvedValue({
        ...HOME,
        taskStats: { total: 12, approved: 9, pending: 2, rejected: 1, completionRate: 0.75 },
        streak: { currentStreak: 3, longestStreak: 11 },
        savedPacks: [
          { name: 'Outdoors Solo pack', missionCount: 3 },
          { name: 'City Friends pack', missionCount: 2 },
        ],
      });
      await renderScreen();
      await waitFor(() =>
        expect(
          screen.getByLabelText(
            'Lifetime stats: 9 quests done, 11 best streak, 2 saved packs',
          ),
        ).toBeTruthy(),
      );
      expect(screen.getByText('9')).toBeTruthy();
      expect(screen.getByText('Quests done')).toBeTruthy();
      expect(screen.getByText('11')).toBeTruthy();
      expect(screen.getByText('Best streak')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('Saved packs')).toBeTruthy();
    });

    it('renders zeroed lifetime stats rather than hiding the row for a brand-new account', async () => {
      await renderScreen();
      await waitFor(() =>
        expect(
          screen.getByLabelText(
            'Lifetime stats: 0 quests done, 7 best streak, 0 saved packs',
          ),
        ).toBeTruthy(),
      );
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

  describe('payment methods entry point', () => {
    it('shows the payment methods row for a signed-in user', async () => {
      await renderSignedIn();
      expect(screen.getByLabelText('Payment methods')).toBeTruthy();
    });

    it('hides the payment methods row for a guest', async () => {
      mockUser = GUEST_USER;
      await renderScreen();
      await waitFor(() => expect(screen.getByText('Level 4')).toBeTruthy());
      expect(screen.queryByLabelText('Payment methods')).toBeNull();
    });

    it('calls onPaymentMethods when the row is tapped', async () => {
      const { onPaymentMethods } = await renderSignedIn();
      await fireEvent.press(screen.getByLabelText('Payment methods'));
      expect(onPaymentMethods).toHaveBeenCalledTimes(1);
    });

    it('does not throw when tapped without a handler', async () => {
      await renderSignedIn(SIGNED_IN_USER, { onPaymentMethods: undefined });
      expect(() =>
        fireEvent.press(screen.getByLabelText('Payment methods')),
      ).not.toThrow();
    });
  });

  describe('display-name editing', () => {
    it('enters edit mode when the edit affordance is pressed', async () => {
      await renderSignedIn();
      await fireEvent.press(screen.getByLabelText('Edit display name'));
      expect(screen.getByLabelText('Display name')).toBeTruthy();
      expect(screen.getByLabelText('Save display name')).toBeTruthy();
    });

    it('saves a new name and pushes the fresh profile into the store', async () => {
      await renderSignedIn();
      await fireEvent.press(screen.getByLabelText('Edit display name'));
      await fireEvent.changeText(
        screen.getByLabelText('Display name'),
        'Jordan Rivera',
      );
      await fireEvent.press(screen.getByLabelText('Save display name'));

      await waitFor(() =>
        expect(mockUpdateDisplayName).toHaveBeenCalledWith('Jordan Rivera'),
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'Jordan Rivera' }),
      );
      // Leaves edit mode after a successful save.
      await waitFor(() =>
        expect(screen.queryByLabelText('Display name')).toBeNull(),
      );
    });

    it('trims surrounding whitespace before sending the name', async () => {
      await renderSignedIn();
      await fireEvent.press(screen.getByLabelText('Edit display name'));
      await fireEvent.changeText(screen.getByLabelText('Display name'), '  Sky  ');
      await fireEvent.press(screen.getByLabelText('Save display name'));
      await waitFor(() =>
        expect(mockUpdateDisplayName).toHaveBeenCalledWith('Sky'),
      );
    });

    it('rejects an empty name without calling the API', async () => {
      await renderSignedIn();
      await fireEvent.press(screen.getByLabelText('Edit display name'));
      await fireEvent.changeText(screen.getByLabelText('Display name'), '   ');
      await fireEvent.press(screen.getByLabelText('Save display name'));

      expect(screen.getByText('Enter a display name')).toBeTruthy();
      expect(mockUpdateDisplayName).not.toHaveBeenCalled();
      // Stays in edit mode so the user can correct the value.
      expect(screen.getByLabelText('Display name')).toBeTruthy();
    });

    it('clears the validation error as the user edits', async () => {
      await renderSignedIn();
      await fireEvent.press(screen.getByLabelText('Edit display name'));
      await fireEvent.changeText(screen.getByLabelText('Display name'), '   ');
      await fireEvent.press(screen.getByLabelText('Save display name'));
      expect(screen.getByText('Enter a display name')).toBeTruthy();

      await fireEvent.changeText(screen.getByLabelText('Display name'), 'Robin');
      expect(screen.queryByText('Enter a display name')).toBeNull();
    });

    it('surfaces an error when the save request fails', async () => {
      mockUpdateDisplayName.mockRejectedValueOnce(new Error('network down'));
      await renderSignedIn();
      await fireEvent.press(screen.getByLabelText('Edit display name'));
      await fireEvent.changeText(screen.getByLabelText('Display name'), 'Robin');
      await fireEvent.press(screen.getByLabelText('Save display name'));

      await waitFor(() =>
        expect(
          screen.getByText("Couldn't save your name. Please try again."),
        ).toBeTruthy(),
      );
      // Still editing after a failure.
      expect(screen.getByLabelText('Display name')).toBeTruthy();
    });

    it('shows a saving state while the update is in flight', async () => {
      // A controllable promise, resolved before the test ends so react-query's
      // mutation settles cleanly rather than leaving a forever-pending mutation
      // that keeps the Jest worker alive.
      let resolveSave: (value: UserProfile) => void = () => {};
      mockUpdateDisplayName.mockReturnValue(
        new Promise<UserProfile>((resolve) => {
          resolveSave = resolve;
        }),
      );
      await renderSignedIn();
      await fireEvent.press(screen.getByLabelText('Edit display name'));
      await fireEvent.changeText(screen.getByLabelText('Display name'), 'Robin');
      await fireEvent.press(screen.getByLabelText('Save display name'));

      await waitFor(() => expect(screen.getByText('Saving…')).toBeTruthy());
      expect(
        screen.getByLabelText('Save display name').props.accessibilityState.busy,
      ).toBe(true);

      resolveSave({ ...SIGNED_IN_USER, displayName: 'Robin' });
      await waitFor(() =>
        expect(screen.queryByLabelText('Display name')).toBeNull(),
      );
    });

    it('cancels editing without calling the API', async () => {
      await renderSignedIn();
      await fireEvent.press(screen.getByLabelText('Edit display name'));
      await fireEvent.press(
        screen.getByLabelText('Cancel editing display name'),
      );
      expect(screen.queryByLabelText('Display name')).toBeNull();
      expect(mockUpdateDisplayName).not.toHaveBeenCalled();
    });
  });

  describe('avatar editing', () => {
    it('uploads a photo from the library and pushes the profile to the store', async () => {
      await renderSignedIn();
      await avatarActionVia(1, 'Add a profile photo');
      await waitFor(() => expect(mockRequestLibrary).toHaveBeenCalled());
      expect(mockLaunchLibrary).toHaveBeenCalled();
      await waitFor(() =>
        expect(mockUploadAvatar).toHaveBeenCalledWith('file:///tmp/lib.png'),
      );
      await waitFor(() =>
        expect(mockUpdateProfile).toHaveBeenCalledWith(SIGNED_IN_WITH_AVATAR),
      );
    });

    it('uploads a photo from the camera path', async () => {
      await renderSignedIn();
      await avatarActionVia(0, 'Add a profile photo');
      await waitFor(() => expect(mockRequestCamera).toHaveBeenCalled());
      await waitFor(() =>
        expect(mockUploadAvatar).toHaveBeenCalledWith(
          'file:///tmp/new-avatar.jpg',
        ),
      );
    });

    it('shows an error when the upload fails', async () => {
      mockUploadAvatar.mockRejectedValueOnce(new Error('S3 down'));
      await renderSignedIn();
      await avatarActionVia(1, 'Add a profile photo');
      await waitFor(() =>
        expect(
          screen.getByText("Couldn't update your photo. Please try again."),
        ).toBeTruthy(),
      );
    });

    it('surfaces a permission error when photo access is denied', async () => {
      mockRequestLibrary.mockResolvedValueOnce(deniedPermission());
      await renderSignedIn();
      await avatarActionVia(1, 'Add a profile photo');
      await waitFor(() =>
        expect(
          screen.getByText(
            'Photo access is off. Enable it in Settings to choose a photo.',
          ),
        ).toBeTruthy(),
      );
      expect(mockUploadAvatar).not.toHaveBeenCalled();
    });

    it('surfaces a permission error when camera access is denied', async () => {
      mockRequestCamera.mockResolvedValueOnce(deniedPermission());
      await renderSignedIn();
      await avatarActionVia(0, 'Add a profile photo');
      await waitFor(() =>
        expect(
          screen.getByText(
            'Camera access is off. Enable it in Settings to take a photo.',
          ),
        ).toBeTruthy(),
      );
      expect(mockUploadAvatar).not.toHaveBeenCalled();
    });

    it('ignores a cancelled picker', async () => {
      mockLaunchLibrary.mockResolvedValueOnce({ canceled: true });
      await renderSignedIn();
      await avatarActionVia(1, 'Add a profile photo');
      await waitFor(() => expect(mockLaunchLibrary).toHaveBeenCalled());
      expect(mockUploadAvatar).not.toHaveBeenCalled();
    });

    it('shows an uploading state on the avatar while in flight', async () => {
      let resolveUpload: (value: UserProfile) => void = () => {};
      mockUploadAvatar.mockReturnValue(
        new Promise<UserProfile>((resolve) => {
          resolveUpload = resolve;
        }),
      );
      await renderSignedIn();
      await avatarActionVia(1, 'Add a profile photo');
      await waitFor(() =>
        expect(screen.getByLabelText('Updating profile photo')).toBeTruthy(),
      );

      // Settle the mutation so no forever-pending mutation leaks past the test.
      resolveUpload(SIGNED_IN_WITH_AVATAR);
      await waitFor(() =>
        expect(mockUpdateProfile).toHaveBeenCalledWith(SIGNED_IN_WITH_AVATAR),
      );
    });

    it('renders the actual avatar image when the user has one', async () => {
      await renderSignedIn(SIGNED_IN_WITH_AVATAR);
      expect(screen.getByLabelText('Your profile photo')).toBeTruthy();
      expect(
        screen.getByLabelText('Change or remove profile photo'),
      ).toBeTruthy();
    });

    it('does not offer removal when there is no avatar', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      await renderSignedIn();
      await fireEvent.press(screen.getByLabelText('Add a profile photo'));
      const buttons = alertSpy.mock.calls[0]?.[2] ?? [];
      expect(buttons.map((b) => b.text)).toEqual([
        'Take Photo',
        'Choose from Library',
        'Cancel',
      ]);
      alertSpy.mockRestore();
    });

    it('removes the current avatar and pushes the cleared profile', async () => {
      await renderSignedIn(SIGNED_IN_WITH_AVATAR);
      await avatarActionVia(2, 'Change or remove profile photo');
      await waitFor(() => expect(mockRemoveAvatar).toHaveBeenCalled());
      await waitFor(() =>
        expect(mockUpdateProfile).toHaveBeenCalledWith(SIGNED_IN_USER),
      );
    });

    it('shows an error when removal fails', async () => {
      mockRemoveAvatar.mockRejectedValueOnce(new Error('S3 down'));
      await renderSignedIn(SIGNED_IN_WITH_AVATAR);
      await avatarActionVia(2, 'Change or remove profile photo');
      await waitFor(() =>
        expect(
          screen.getByText("Couldn't remove your photo. Please try again."),
        ).toBeTruthy(),
      );
    });
  });

  describe('guest gating', () => {
    it('hides the name and avatar edit affordances for a guest', async () => {
      mockUser = GUEST_USER;
      await renderScreen();
      expect(screen.queryByLabelText('Edit display name')).toBeNull();
      expect(screen.queryByLabelText('Add a profile photo')).toBeNull();
      expect(screen.queryByLabelText('Change or remove profile photo')).toBeNull();
    });
  });

  describe('validateDisplayName', () => {
    it('accepts a name within the 1-50 char bounds', () => {
      expect(validateDisplayName('Ada')).toBeNull();
    });

    it('rejects an empty or whitespace-only name', () => {
      expect(validateDisplayName('')).toBe('Enter a display name');
      expect(validateDisplayName('   ')).toBe('Enter a display name');
    });

    it('rejects a name longer than 50 characters', () => {
      expect(validateDisplayName('a'.repeat(51))).toBe(
        'Keep it to 50 characters or fewer',
      );
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

    it('gives every interactive element a button role and a label (signed in)', async () => {
      await renderSignedIn();
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => {
        expect(btn.props.accessibilityLabel).toBeTruthy();
      });
    });

    it('labels the avatar control and the name edit control', async () => {
      await renderSignedIn();
      expect(screen.getByLabelText('Add a profile photo')).toBeTruthy();
      expect(screen.getByLabelText('Edit display name')).toBeTruthy();
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
