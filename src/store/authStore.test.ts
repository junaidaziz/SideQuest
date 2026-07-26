import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuthStore } from './authStore';
import { getTokens, saveTokens, clearTokens } from '../services/tokenStorage';
import {
  bootstrapGuest,
  getCurrentUser,
  googleAuth,
  login,
  logoutRequest,
  signup,
} from '../services/authApi';
import { clearPersistedQueryCache } from '../services/queryPersistence';
import { unregisterCurrentDevice } from '../services/pushNotifications';

jest.mock('../services/tokenStorage');
jest.mock('../services/authApi');
jest.mock('../services/queryPersistence');
jest.mock('../services/pushNotifications');

// Never let the real native module load under Jest. `isSuccessResponse`
// mirrors the library's actual discriminant (response.type === 'success').
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
  },
  isSuccessResponse: (response: { type?: string } | null | undefined) =>
    response?.type === 'success',
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

const mockSignIn = GoogleSignin.signIn as jest.Mock;
const mockHasPlayServices = GoogleSignin.hasPlayServices as jest.Mock;

/** A minimal successful signIn() result carrying an ID token. */
function googleSuccess(idToken: string | null) {
  return {
    type: 'success',
    data: {
      idToken,
      serverAuthCode: null,
      scopes: [],
      user: {
        id: 'g1',
        email: 'g@example.com',
        name: 'G',
        photo: null,
        familyName: null,
        givenName: null,
      },
    },
  };
}

const guestUser = {
  id: 'u1',
  email: null,
  displayName: null,
  isGuest: true,
  avatarUrl: null,
  avatarVariants: [],
};
const realUser = {
  id: 'u1',
  email: 'a@b.com',
  displayName: 'A',
  isGuest: false,
  avatarUrl: null,
  avatarVariants: [],
};

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, status: 'idle', isFirstLaunch: null });
  });

  describe('hydrate', () => {
    it('restores the session from stored tokens when present', async () => {
      (getTokens as jest.Mock).mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
      (getCurrentUser as jest.Mock).mockResolvedValue(realUser);

      await useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().user).toEqual(realUser);
      expect(useAuthStore.getState().status).toBe('ready');
      expect(useAuthStore.getState().isFirstLaunch).toBe(false);
      expect(bootstrapGuest).not.toHaveBeenCalled();
    });

    it('bootstraps a guest session when no tokens are stored', async () => {
      (getTokens as jest.Mock).mockResolvedValue(null);
      (bootstrapGuest as jest.Mock).mockResolvedValue({
        accessToken: 'g',
        refreshToken: 'gr',
        user: guestUser,
      });

      await useAuthStore.getState().hydrate();

      expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'g', refreshToken: 'gr' });
      expect(useAuthStore.getState().user).toEqual(guestUser);
      expect(useAuthStore.getState().status).toBe('ready');
      expect(useAuthStore.getState().isFirstLaunch).toBe(true);
    });

    it('sets status to error when hydration fails', async () => {
      (getTokens as jest.Mock).mockRejectedValue(new Error('storage unavailable'));

      await useAuthStore.getState().hydrate();

      expect(useAuthStore.getState().status).toBe('error');
      expect(useAuthStore.getState().isFirstLaunch).toBeNull();
    });
  });

  describe('login', () => {
    it('stores tokens and sets the returned user', async () => {
      (login as jest.Mock).mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        user: realUser,
      });

      await useAuthStore.getState().login({ email: 'a@b.com', password: 'hunter22' });

      expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
      expect(useAuthStore.getState().user).toEqual(realUser);
      expect(useAuthStore.getState().status).toBe('ready');
    });
  });

  describe('updateProfile', () => {
    it('replaces the cached user with the supplied profile', () => {
      useAuthStore.setState({ user: realUser, status: 'ready' });
      const updated = { ...realUser, displayName: 'Renamed', avatarUrl: 'u' };

      useAuthStore.getState().updateProfile(updated);

      expect(useAuthStore.getState().user).toEqual(updated);
      // A profile push does not disturb session status.
      expect(useAuthStore.getState().status).toBe('ready');
    });
  });

  describe('signup', () => {
    it('stores tokens and sets the returned (possibly upgraded) user', async () => {
      (signup as jest.Mock).mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        user: realUser,
      });

      await useAuthStore.getState().signup({ email: 'a@b.com', password: 'hunter22' });

      expect(useAuthStore.getState().user).toEqual(realUser);
    });
  });

  describe('loginWithGoogle', () => {
    beforeEach(() => {
      mockHasPlayServices.mockResolvedValue(true);
    });

    it('checks Play Services, exchanges the ID token, saves tokens, and promotes the session', async () => {
      mockSignIn.mockResolvedValue(googleSuccess('google-id-token'));
      (googleAuth as jest.Mock).mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        user: realUser,
      });

      await useAuthStore.getState().loginWithGoogle();

      expect(mockHasPlayServices).toHaveBeenCalled();
      expect(googleAuth).toHaveBeenCalledWith({ idToken: 'google-id-token' });
      expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
      expect(useAuthStore.getState().user).toEqual(realUser);
      expect(useAuthStore.getState().status).toBe('ready');
    });

    it('rejects with a SIGN_IN_CANCELLED-coded error when the user dismisses the picker, without touching the session', async () => {
      mockSignIn.mockResolvedValue({ type: 'cancelled', data: null });

      await expect(useAuthStore.getState().loginWithGoogle()).rejects.toMatchObject({
        code: 'SIGN_IN_CANCELLED',
      });

      // A cancellation must not exchange anything or corrupt the store.
      expect(googleAuth).not.toHaveBeenCalled();
      expect(saveTokens).not.toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().status).toBe('idle');
    });

    it('throws when the successful sign-in carries no ID token', async () => {
      mockSignIn.mockResolvedValue(googleSuccess(null));

      await expect(useAuthStore.getState().loginWithGoogle()).rejects.toThrow(
        /did not return an ID token/,
      );
      expect(googleAuth).not.toHaveBeenCalled();
      expect(saveTokens).not.toHaveBeenCalled();
    });

    it('propagates a backend exchange failure without corrupting store state', async () => {
      mockSignIn.mockResolvedValue(googleSuccess('google-id-token'));
      (googleAuth as jest.Mock).mockRejectedValue(new Error('backend rejected token'));

      await expect(useAuthStore.getState().loginWithGoogle()).rejects.toThrow(
        'backend rejected token',
      );
      expect(saveTokens).not.toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().status).toBe('idle');
    });

    it('propagates a Play Services failure before any sign-in is attempted', async () => {
      mockHasPlayServices.mockRejectedValue(new Error('play services unavailable'));

      await expect(useAuthStore.getState().loginWithGoogle()).rejects.toThrow(
        'play services unavailable',
      );
      expect(mockSignIn).not.toHaveBeenCalled();
      expect(googleAuth).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes the session server-side, then clears tokens and re-bootstraps a fresh guest session', async () => {
      useAuthStore.setState({ user: realUser, status: 'ready', isFirstLaunch: false });
      (logoutRequest as jest.Mock).mockResolvedValue({ success: true });
      (getTokens as jest.Mock).mockResolvedValue(null);
      (bootstrapGuest as jest.Mock).mockResolvedValue({
        accessToken: 'g2',
        refreshToken: 'gr2',
        user: guestUser,
      });

      await useAuthStore.getState().logout();

      expect(logoutRequest).toHaveBeenCalled();
      expect(clearTokens).toHaveBeenCalled();
      // Regression test: an independent review found the persisted query
      // cache (Home/Challenges/Referrals data) survived a logout, so the
      // next user on a shared device would have their cold start rehydrate
      // the previous user's data from AsyncStorage.
      expect(clearPersistedQueryCache).toHaveBeenCalled();
      // Deregisters this device's push token while the access token is
      // still valid, so a shared device stops receiving the previous
      // session's notifications once it's handed back to a fresh guest.
      expect(unregisterCurrentDevice).toHaveBeenCalled();
      // Ends in a fully 'ready' state with a fresh guest — not stuck idle —
      // since nothing besides the root layout's one-time mount effect would
      // otherwise ever re-trigger hydrate() after this.
      expect(bootstrapGuest).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toEqual(guestUser);
      expect(useAuthStore.getState().status).toBe('ready');
      expect(useAuthStore.getState().isFirstLaunch).toBe(true);
    });

    it('still clears local tokens and re-bootstraps when server-side revocation fails (offline/server down)', async () => {
      useAuthStore.setState({ user: realUser, status: 'ready', isFirstLaunch: false });
      (logoutRequest as jest.Mock).mockRejectedValue(new Error('network unavailable'));
      (getTokens as jest.Mock).mockResolvedValue(null);
      (bootstrapGuest as jest.Mock).mockResolvedValue({
        accessToken: 'g2',
        refreshToken: 'gr2',
        user: guestUser,
      });

      await useAuthStore.getState().logout();

      expect(logoutRequest).toHaveBeenCalled();
      expect(clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('ready');
      expect(useAuthStore.getState().user).toEqual(guestUser);
    });

    it('still completes logout when clearing the persisted query cache fails', async () => {
      useAuthStore.setState({ user: realUser, status: 'ready', isFirstLaunch: false });
      (logoutRequest as jest.Mock).mockResolvedValue({ success: true });
      (clearPersistedQueryCache as jest.Mock).mockRejectedValue(new Error('AsyncStorage unavailable'));
      (getTokens as jest.Mock).mockResolvedValue(null);
      (bootstrapGuest as jest.Mock).mockResolvedValue({
        accessToken: 'g2',
        refreshToken: 'gr2',
        user: guestUser,
      });

      await useAuthStore.getState().logout();

      expect(clearPersistedQueryCache).toHaveBeenCalled();
      expect(clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().status).toBe('ready');
      expect(useAuthStore.getState().user).toEqual(guestUser);
    });

    it('leaves status as error if the post-logout re-hydrate fails', async () => {
      useAuthStore.setState({ user: realUser, status: 'ready', isFirstLaunch: false });
      (logoutRequest as jest.Mock).mockResolvedValue({ success: true });
      (getTokens as jest.Mock).mockRejectedValue(new Error('storage unavailable'));

      await useAuthStore.getState().logout();

      expect(clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().status).toBe('error');
    });
  });
});
